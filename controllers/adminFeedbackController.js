import pool from "../config/db.config.js"

class AdminFeedbackController {
  async getFeedbackResponses(req, res) {
    try {
      const { surveyId, language, status = "completed", page = 1, limit = 50 } = req.query

      let query = `
        SELECT 
          fr.id,
          fr.survey_id as "surveyId",
          s.title as "surveyTitle",
          fr.session_id as "sessionId",
          fr.language,
          fr.status,
          fr.submitted_at as "submittedAt",
          fr.created_at as "createdAt",
          fr.updated_at as "updatedAt",
          json_agg(
            json_build_object(
              'questionId', ra.question_id,
              'questionText', sq.prompt,
              'questionType', sq.type,
              'answerText', ra.answer_text,
              'answerNumber', ra.answer_number,
              'answerBoolean', ra.answer_bool,
              'selectedOptions', ra.answer_json,
              'skipped', ra.skipped
            )
          ) as answers
        FROM feedback_responses fr
        JOIN surveys s ON fr.survey_id = s.id
        LEFT JOIN response_answers ra ON fr.id = ra.response_id
        LEFT JOIN survey_questions sq ON ra.question_id = sq.id
        WHERE fr.status = $1
      `

      const params = [status]
      let paramIndex = 2

      if (surveyId) {
        query += ` AND fr.survey_id = $${paramIndex}`
        params.push(surveyId)
        paramIndex++
      }

      if (language) {
        query += ` AND fr.language = $${paramIndex}`
        params.push(language)
        paramIndex++
      }

      query += `
        GROUP BY fr.id, fr.survey_id, fr.session_id, fr.language, fr.status, 
                 fr.submitted_at, fr.created_at, fr.updated_at, s.title
        ORDER BY fr.submitted_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `

      const offset = (page - 1) * limit
      params.push(limit, offset)

      const result = await pool.query(query, params)

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) 
        FROM feedback_responses fr
        WHERE fr.status = $1
      `
      const countParams = [status]
      let countParamIndex = 2

      if (surveyId) {
        countQuery += ` AND fr.survey_id = $${countParamIndex}`
        countParams.push(surveyId)
        countParamIndex++
      }

      if (language) {
        countQuery += ` AND fr.language = $${countParamIndex}`
        countParams.push(language)
        countParamIndex++
      }

      const countResult = await pool.query(countQuery, countParams)
      const totalCount = parseInt(countResult.rows[0].count)
      const totalPages = Math.ceil(totalCount / limit)

      // Helper function to extract rating from answers
      const extractRatingFromAnswers = (answers) => {
        if (!answers || !Array.isArray(answers)) return null

        const ratingAnswer = answers.find((a) => 
          (a.questionType === "rating" || a.questionType === "emoji-rating") && 
          a.answerNumber !== null
        )
        return ratingAnswer ? ratingAnswer.answerNumber : null
      }

      const responses = result.rows.map((row) => ({
        id: row.id,
        surveyId: row.surveyId,
        surveyTitle: row.surveyTitle,
        sessionId: row.sessionId,
        language: row.language,
        status: row.status,
        submittedAt: row.submittedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        answers: row.answers || [],
        overallRating: extractRatingFromAnswers(row.answers),
      }))

      res.json({
        responses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      })
    } catch (error) {
      console.error("Error fetching feedback responses:", error)
      res.status(500).json({ error: "Failed to fetch feedback responses" })
    }
  }

  async getResponseStats(req, res) {
    try {
      const { surveyId, days = 30 } = req.query

      let query = `
        SELECT 
          COUNT(*) as total_responses,
          AVG(fr.overall_rating) as avg_rating,
          COUNT(DISTINCT fr.session_id) as unique_sessions,
          MIN(fr.submitted_at) as first_response,
          MAX(fr.submitted_at) as last_response
        FROM feedback_responses fr
        WHERE fr.status = 'completed'
      `

      const params = []
      let paramIndex = 1

      if (surveyId) {
        query += ` AND fr.survey_id = $${paramIndex}`
        params.push(surveyId)
        paramIndex++
      }

      if (days) {
        query += ` AND fr.submitted_at >= NOW() - INTERVAL '${days} days'`
      }

      const result = await pool.query(query, params)

      // Get responses by day for the chart
      const dailyQuery = `
        SELECT 
          DATE(fr.submitted_at) as date, 
          COUNT(*) as count
        FROM feedback_responses fr
        WHERE fr.status = 'completed'
        ${surveyId ? `AND fr.survey_id = $1` : ''}
        ${days ? `AND fr.submitted_at >= NOW() - INTERVAL '${days} days'` : ''}
        GROUP BY DATE(fr.submitted_at)
        ORDER BY date DESC
      `

      const dailyResult = await pool.query(
        dailyQuery, 
        surveyId ? [surveyId] : []
      )

      // Get rating distribution
      const ratingQuery = `
        SELECT 
          CASE 
            WHEN fr.overall_rating >= 4.5 THEN '5 Stars'
            WHEN fr.overall_rating >= 3.5 THEN '4 Stars'
            WHEN fr.overall_rating >= 2.5 THEN '3 Stars'
            WHEN fr.overall_rating >= 1.5 THEN '2 Stars'
            ELSE '1 Star'
          END as rating_category,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 1) as percentage
        FROM feedback_responses fr
        WHERE fr.status = 'completed' AND fr.overall_rating IS NOT NULL
        ${surveyId ? `AND fr.survey_id = $1` : ''}
        ${days ? `AND fr.submitted_at >= NOW() - INTERVAL '${days} days'` : ''}
        GROUP BY rating_category
        ORDER BY rating_category DESC
      `

      const ratingResult = await pool.query(
        ratingQuery, 
        surveyId ? [surveyId] : []
      )

      res.json({
        totalResponses: parseInt(result.rows[0].total_responses) || 0,
        averageRating: parseFloat(result.rows[0].avg_rating) || 0,
        uniqueSessions: parseInt(result.rows[0].unique_sessions) || 0,
        firstResponse: result.rows[0].first_response,
        lastResponse: result.rows[0].last_response,
        responsesByDay: dailyResult.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count),
        })),
        ratingDistribution: ratingResult.rows.map(row => ({
          rating: row.rating_category,
          count: parseInt(row.count),
          percentage: parseFloat(row.percentage),
        })),
      })
    } catch (error) {
      console.error("Error fetching response stats:", error)
      res.status(500).json({ error: "Failed to fetch response statistics" })
    }
  }

  async deleteResponse(req, res) {
    try {
      const { id } = req.params

      // First delete related answers
      await pool.query('DELETE FROM response_answers WHERE response_id = $1', [id])

      // Then delete the response
      const result = await pool.query('DELETE FROM feedback_responses WHERE id = $1 RETURNING id', [id])

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Response not found" })
      }

      res.json({ message: "Response deleted successfully" })
    } catch (error) {
      console.error("Error deleting response:", error)
      res.status(500).json({ error: "Failed to delete response" })
    }
  }

  async exportResponses(req, res) {
    try {
      const { surveyId, format = 'json' } = req.query

      let query = `
        SELECT 
          fr.id,
          fr.survey_id as "surveyId",
          s.title as "surveyTitle",
          fr.session_id as "sessionId",
          fr.language,
          fr.status,
          fr.submitted_at as "submittedAt",
          json_agg(
            json_build_object(
              'questionId', ra.question_id,
              'questionText', sq.prompt,
              'questionType', sq.type,
              'answerText', ra.answer_text,
              'answerNumber', ra.answer_number,
              'answerBoolean', ra.answer_bool,
              'selectedOptions', ra.answer_json,
              'skipped', ra.skipped
            )
          ) as answers
        FROM feedback_responses fr
        JOIN surveys s ON fr.survey_id = s.id
        LEFT JOIN response_answers ra ON fr.id = ra.response_id
        LEFT JOIN survey_questions sq ON ra.question_id = sq.id
        WHERE fr.status = 'completed'
      `

      const params = []
      let paramIndex = 1

      if (surveyId) {
        query += ` AND fr.survey_id = $${paramIndex}`
        params.push(surveyId)
        paramIndex++
      }

      query += `
        GROUP BY fr.id, fr.survey_id, fr.session_id, fr.language, fr.status, 
                 fr.submitted_at, s.title
        ORDER BY fr.submitted_at DESC
      `

      const result = await pool.query(query, params)

      const responses = result.rows.map((row) => ({
        id: row.id,
        surveyId: row.surveyId,
        surveyTitle: row.surveyTitle,
        sessionId: row.sessionId,
        language: row.language,
        status: row.status,
        submittedAt: row.submittedAt,
        answers: row.answers || [],
      }))

      if (format === 'csv') {
        // Convert to CSV format
        const header = 'ID,Survey ID,Survey Title,Session ID,Language,Status,Submitted At,Answers\n'
        const csvData = responses.map(response => {
          const answersStr = response.answers.map(a => 
            `${a.questionText}: ${a.answerText || a.answerNumber || a.answerBoolean || (a.selectedOptions ? JSON.stringify(a.selectedOptions) : 'Skipped')}`
          ).join('; ')
          
          return `"${response.id}","${response.surveyId}","${response.surveyTitle}","${response.sessionId}","${response.language}","${response.status}","${response.submittedAt}","${answersStr}"`
        }).join('\n')
        
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', 'attachment; filename=feedback-responses.csv')
        res.send(header + csvData)
      } else {
        // Default to JSON
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Disposition', 'attachment; filename=feedback-responses.json')
        res.send(JSON.stringify(responses, null, 2))
      }
    } catch (error) {
      console.error("Error exporting responses:", error)
      res.status(500).json({ error: "Failed to export responses" })
    }
  }

  // // Helper method to extract rating from answers
  // extractRatingFromAnswers(answers) {
  //   if (!answers || !Array.isArray(answers)) return null

  //   const ratingAnswer = answers.find((a) => 
  //     (a.questionType === "rating" || a.questionType === "emoji-rating") && 
  //     a.answerNumber !== null
  //   )
  //   return ratingAnswer ? ratingAnswer.answerNumber : null
  // }
}

export const adminFeedbackController = new AdminFeedbackController()