import pool from "../config/db.config.js"

class VisitorFeedbackController {
  async getSurveys(req, res) {
    try {
      const { language = "en", active, includeQuestions = "false" } = req.query

      let query = `
        SELECT s.*,
              COUNT(DISTINCT sq.id) as question_count,
              COUNT(DISTINCT fr.id) as response_count
        FROM surveys s
        LEFT JOIN survey_questions sq ON s.id = sq.survey_id
        LEFT JOIN feedback_responses fr ON s.id = fr.survey_id AND fr.status = 'completed'
        WHERE s.language = $1
      `
      const params = [language]

      if (active === "true") {
        query += " AND s.is_active = true"
      }

      query += `
        GROUP BY s.id, s.title, s.description, s.language, s.is_active, s.created_at, s.updated_at
        ORDER BY s.created_at DESC
      `

      const result = await pool.query(query, params)

      const surveys = await Promise.all(result.rows.map(async (row) => {
        const survey = {
          id: row.id,
          title: row.title,
          description: row.description,
          language: row.language,
          isActive: row.is_active,
          questionCount: Number.parseInt(row.question_count),
          responseCount: Number.parseInt(row.response_count),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }

        // Include questions if requested
        if (includeQuestions === "true") {
          const questionsQuery = `
            SELECT
              sq.id,
              sq.prompt as text,
              sq.type,
              sq.required,
              sq.ordinal as question_order,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', qo.id,
                    'text', qo.label,
                    'value', qo.value
                  ) ORDER BY qo.ordinal
                ) FILTER (WHERE qo.id IS NOT NULL),
                '[]'
              ) as options
            FROM survey_questions sq
            LEFT JOIN question_options qo ON sq.id = qo.question_id
            WHERE sq.survey_id = $1
            GROUP BY sq.id, sq.prompt, sq.type, sq.required, sq.ordinal
            ORDER BY sq.ordinal
          `

          const questionsResult = await pool.query(questionsQuery, [row.id])
          survey.questions = questionsResult.rows.map((q) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            required: q.required,
            order: q.question_order,
            options: q.options || [],
          }))
        }

        return survey
      }))

      res.json(surveys)
    } catch (error) {
      console.error("Error fetching surveys:", error)
      res.status(500).json({ error: "Failed to fetch surveys" })
    }
  }

  async getSurveyById(req, res) {
    try {
      const { id } = req.params;

      // Check if the id is a valid integer
      if (isNaN(parseInt(id))) {
        return res.status(400).json({ error: "Invalid survey ID. Must be an integer." });
      }

      // Get survey details
      const surveyQuery = "SELECT * FROM surveys WHERE id = $1";
      const surveyResult = await pool.query(surveyQuery, [id]);

      if (surveyResult.rows.length === 0) {
        return res.status(404).json({ error: "Survey not found" });
      }

      const survey = surveyResult.rows[0];

      // Get questions with options
      const questionsQuery = `
        SELECT
          sq.id,
          sq.prompt as text,
          sq.type,
          sq.required,
          sq.ordinal as question_order,
          COALESCE(
            json_agg(
              json_build_object(
                'id', qo.id,
                'text', qo.label,
                'value', qo.value
              ) ORDER BY qo.ordinal
            ) FILTER (WHERE qo.id IS NOT NULL),
            '[]'
          ) as options
        FROM survey_questions sq
        LEFT JOIN question_options qo ON sq.id = qo.question_id
        WHERE sq.survey_id = $1
        GROUP BY sq.id, sq.prompt, sq.type, sq.required, sq.ordinal
        ORDER BY sq.ordinal
      `;

      const questionsResult = await pool.query(questionsQuery, [id]);

      const formattedSurvey = {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        language: survey.language,
        isActive: survey.is_active,
        questions: questionsResult.rows.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          required: q.required,
          order: q.question_order,
          options: q.options,
        })),
        createdAt: survey.created_at,
        updatedAt: survey.updated_at,
      };

      res.json(formattedSurvey);
    } catch (error) {
      console.error("Error fetching survey by ID:", error);
      res.status(500).json({ error: "Failed to fetch survey" });
    }
  }

  async submitFeedback(req, res) {
    const client = await pool.connect()

    try {
      if (!req.body) {
        return res.status(400).json({ error: "Request body is missing" });
      }

      const { surveyId, answers, language = "en", sessionId } = req.body

      if (!surveyId || !answers) {
        return res.status(400).json({ error: "Survey ID and answers are required" })
      }

      await client.query("BEGIN")

      // Validate that the survey exists and is active
      const surveyCheck = await client.query(
        'SELECT id FROM surveys WHERE id = $1 AND is_active = true',
        [surveyId]
      );
      if (surveyCheck.rows.length === 0) {
        await client.query("ROLLBACK")
        return res.status(404).json({ error: 'Survey not found or not active' });
      }

      // Create feedback response
      const responseQuery = `
        INSERT INTO feedback_responses (survey_id, session_id, language, status, submitted_at)
        VALUES ($1, $2, $3, 'completed', NOW())
        RETURNING id
      `

      const responseResult = await client.query(responseQuery, [
        surveyId,
        sessionId || `session_${Date.now()}`,
        language,
      ])

      const responseId = responseResult.rows[0].id

      // Insert individual answers
      for (const answer of answers) {
        // Validate that the question belongs to this survey
        const questionCheck = await client.query(
          'SELECT id FROM survey_questions WHERE id = $1 AND survey_id = $2',
          [answer.questionId, surveyId]
        );
        if (questionCheck.rows.length === 0) {
          // Skip answers referencing questions that don't belong to this survey
          continue;
        }

        const answerQuery = `
          INSERT INTO response_answers (
            response_id, question_id, answer_text, answer_number,
            answer_bool, answer_json, skipped
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `

        // Determine the answer type and format accordingly
        let answerText = null;
        let answerNumber = null;
        let answerBool = null;
        let answerJson = null;
        let skipped = false;

        if (answer.value === "skipped") {
          skipped = true;
        } else if (answer.type === "text") {
          answerText = answer.value;
        } else if (answer.type === "rating" || answer.type === "number") {
          answerNumber = Number.parseFloat(answer.value);
        } else if (answer.type === "boolean") {
          answerBool = answer.value === "yes" || answer.value === true;
        } else if (answer.type === "single_choice" || answer.type === "multi_choice") {
          answerJson = Array.isArray(answer.value) ? answer.value : [answer.value];
        }

        const answerParams = [
          responseId,
          answer.questionId,
          answerText,
          answerNumber,
          answerBool,
          answerJson ? JSON.stringify(answerJson) : null,
          skipped
        ]

        await client.query(answerQuery, answerParams)
      }

      await client.query("COMMIT")

      res.json({
        success: true,
        responseId,
        message: "Feedback submitted successfully",
      })
    } catch (error) {
      await client.query("ROLLBACK")
      console.error("Error submitting feedback:", error)
      res.status(500).json({ error: "Failed to submit feedback" })
    } finally {
      client.release()
    }
  }

  async getFeedbackResponses(req, res) {
    try {
      const { surveyId, language, status = "completed" } = req.query

      let query = `
        SELECT fr.*, s.title as survey_title,
               json_agg(
                 json_build_object(
                   'questionId', ra.question_id,
                   'questionText', sq.prompt,
                   'questionType', sq.type,
                   'answerText', ra.answer_text,
                   'answerNumber', ra.answer_number,
                   'answerBoolean', ra.answer_bool,
                   'selectedOptions', ra.answer_json
                 ) ORDER BY sq.ordinal
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
      `

      const result = await pool.query(query, params)

      const responses = result.rows.map((row) => ({
        id: row.id,
        surveyId: row.survey_id,
        surveyTitle: row.survey_title,
        sessionId: row.session_id,
        language: row.language,
        status: row.status,
        submittedAt: row.submitted_at,
        answers: row.answers || [],
        overallRating: this.extractRatingFromAnswers(row.answers),
      }))

      res.json(responses)
    } catch (error) {
      console.error("Error fetching feedback responses:", error)
      res.status(500).json({ error: "Failed to fetch feedback responses" })
    }
  }

  async getSurveyStats(req, res) {
    try {
      const { surveyId } = req.params;

      // Validate that surveyId is a number
      if (isNaN(parseInt(surveyId))) {
        console.log("❌ [SERVER] Invalid surveyId:", surveyId);
        return res.status(400).json({ error: "Invalid survey ID. Must be an integer." });
      }

      // Get total responses
      const totalQuery = `
        SELECT COUNT(*) as total_responses,
              AVG(CASE WHEN ra.answer_number IS NOT NULL AND sq.type = 'rating'
                  THEN ra.answer_number END) as avg_rating
        FROM feedback_responses fr
        LEFT JOIN response_answers ra ON fr.id = ra.response_id
        LEFT JOIN survey_questions sq ON ra.question_id = sq.id
        WHERE fr.survey_id = $1 AND fr.status = 'completed'
      `;

      const totalResult = await pool.query(totalQuery, [surveyId]);
      const { total_responses, avg_rating } = totalResult.rows[0];

      // Get responses by day
      const dailyQuery = `
        SELECT DATE(submitted_at) as date, COUNT(*) as count
        FROM feedback_responses
        WHERE survey_id = $1 AND status = 'completed'
        GROUP BY DATE(submitted_at)
        ORDER BY date DESC
        LIMIT 30
      `;

      const dailyResult = await pool.query(dailyQuery, [surveyId]);

      res.json({
        totalResponses: Number.parseInt(total_responses) || 0,
        averageRating: avg_rating ? Math.round(Number.parseFloat(avg_rating) * 10) / 10 : 0,
        completionRate: 100, // All stored responses are completed
        responsesByDay: dailyResult.rows.map((row) => ({
          date: row.date,
          count: Number.parseInt(row.count),
        })),
        demographicBreakdown: {}, // Can be expanded based on survey questions
      });
    } catch (error) {
      console.error("Error fetching survey stats:", error);
      res.status(500).json({ error: "Failed to fetch survey statistics" });
    }
  }

  // Helper method to extract rating from answers for legacy compatibility
  extractRatingFromAnswers(answers) {
    if (!answers || !Array.isArray(answers)) return null

    const ratingAnswer = answers.find((a) => a.questionType === "rating" && a.answerNumber !== null)
    return ratingAnswer ? ratingAnswer.answerNumber : null
  }
}

export const feedbackController = new VisitorFeedbackController();
