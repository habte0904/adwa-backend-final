import pool from "../config/db.config.js";

// Get responses with their answers
export const getResponses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT fr.*, 
             json_agg(
               json_build_object(
                 'questionId', ra.question_id,
                 'answerText', ra.answer_text,
                 'answerNumber', ra.answer_number,
                 'answerBool', ra.answer_bool,
                  'answerValue', ra.answer_json,
                 'skipped', ra.skipped
               )
             ) as answers
      FROM feedback_responses fr
      LEFT JOIN response_answers ra ON fr.id = ra.response_id
      GROUP BY fr.id
      ORDER BY fr.submitted_at DESC
      LIMIT 100
    `);

    res.json({ responses: result.rows });
  } catch (error) {
    console.error("Error fetching responses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// Survey statistics
export const getStats = async (req, res) => {
  try {
    const totalRes = await pool.query("SELECT COUNT(*) FROM feedback_responses");
    const totalResponses = parseInt(totalRes.rows[0].count);

    const avgRes = await pool.query(`
      SELECT AVG(answer_number) as avg_rating 
      FROM response_answers 
      WHERE answer_number IS NOT NULL
    `);
    const averageRating = parseFloat(avgRes.rows[0].avg_rating) || 0;

    const completionRate = 100;

    const responsesByDayRes = await pool.query(`
      SELECT DATE(submitted_at) as date, COUNT(*) as count
      FROM feedback_responses
      WHERE submitted_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(submitted_at)
      ORDER BY date
    `);

    res.json({
      totalResponses,
      averageRating: averageRating.toFixed(2),
      completionRate,
      responsesByDay: responsesByDayRes.rows,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get questions for a given survey
// Get questions for both English and Amharic surveys
export const getQuestions = async (req, res) => {
  try {
    const { surveyId = 1 } = req.query;

    // Get questions for both languages with their options
    const result = await pool.query(`
      WITH en_questions AS (
        SELECT sq.*, 
               json_agg(
                 json_build_object(
                   'id', qo.id,
                   'value', qo.value,
                   'label', qo.label,
                   'ordinal', qo.ordinal
                 ) ORDER BY qo.ordinal
               ) as options
        FROM survey_questions sq
        LEFT JOIN question_options qo ON sq.id = qo.question_id
        WHERE sq.survey_id = 1 AND sq.is_deleted = false
        GROUP BY sq.id
      ),
      am_questions AS (
        SELECT sq.*, 
               json_agg(
                 json_build_object(
                   'id', qo.id,
                   'value', qo.value,
                   'label', qo.label,
                   'ordinal', qo.ordinal
                 ) ORDER BY qo.ordinal
               ) as options
        FROM survey_questions sq
        LEFT JOIN question_options qo ON sq.id = qo.question_id
        WHERE sq.survey_id = 2 AND sq.is_deleted = false
        GROUP BY sq.id
      )
      SELECT 
        en.id,
        en.ordinal,
        en.type,
        en.prompt as prompt_en,
        am.prompt as prompt_am,
        en.required,
        en.options as options_en,
        am.options as options_am
      FROM en_questions en
      JOIN am_questions am ON en.ordinal = am.ordinal
      ORDER BY en.ordinal
    `);

    // Transform the data to match frontend expectations
    const questions = result.rows.map(row => ({
      id: row.id,
      ordinal: row.ordinal,
      type: row.type,
      prompt: row.prompt_en, // English prompt
      prompt_am: row.prompt_am, // Amharic prompt
      required: row.required,
      options: row.options_en.map((enOpt, index) => ({
        id: enOpt.id,
        value: enOpt.value,
        label: enOpt.label, // English label
        label_am: row.options_am[index]?.label || "", // Amharic label
        ordinal: enOpt.ordinal
      }))
    }));

    res.json({ questions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// Add a question into EN + AM surveys
export const addQuestion = async (req, res) => {
  const { type, promptEn, promptAm, required, options, ordinal } = req.body;

  try {
    // Ensure ordinal is unique for BOTH EN + AM surveys
    let finalOrdinal = ordinal;

    const checkOrdinal = await pool.query(
      `SELECT 1 FROM survey_questions WHERE survey_id IN (1,2) AND ordinal = $1`,
      [ordinal]
    );

    if (checkOrdinal.rows.length > 0) {
      const maxOrdinalRes = await pool.query(
        `SELECT COALESCE(MAX(ordinal), 0) + 1 as next_ordinal
         FROM survey_questions 
         WHERE survey_id IN (1,2)`
      );
      finalOrdinal = maxOrdinalRes.rows[0].next_ordinal;
    }

    // Insert EN question
    const enQuestionRes = await pool.query(
      `INSERT INTO survey_questions (survey_id, ordinal, type, prompt, required) 
       VALUES (1, $1, $2, $3, $4) RETURNING *`,
      [finalOrdinal, type, promptEn, required]
    );

    // Insert AM question (same ordinal)
    const amQuestionRes = await pool.query(
      `INSERT INTO survey_questions (survey_id, ordinal, type, prompt, required) 
       VALUES (2, $1, $2, $3, $4) RETURNING *`,
      [finalOrdinal, type, promptAm, required]
    );

    const enQuestion = enQuestionRes.rows[0];
    const amQuestion = amQuestionRes.rows[0];

    // Add options if multiple-choice
    if (type === "multiple-choice" && options && options.length > 0) {
      for (const option of options) {
        // English option
        await pool.query(
          `INSERT INTO question_options (question_id, value, label, ordinal) 
           VALUES ($1, $2, $3, $4)`,
          [enQuestion.id, option.value, option.labelEn, option.ordinal]
        );

        // Amharic option
        await pool.query(
          `INSERT INTO question_options (question_id, value, label, ordinal) 
           VALUES ($1, $2, $3, $4)`,
          [amQuestion.id, option.value, option.labelAm, option.ordinal]
        );
      }
    }

    res.json({ success: true, enQuestion, amQuestion });
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update question in EN + AM surveys
export const updateQuestion = async (req, res) => {
  const { id } = req.params;
  const { type, promptEn, promptAm, required, options, ordinal } = req.body;

  try {
    // Get the EN question first (id is assumed EN id)
    const enQRes = await pool.query(
      `SELECT ordinal FROM survey_questions WHERE id = $1 AND survey_id = 1`,
      [id]
    );
    if (enQRes.rows.length === 0) {
      return res.status(404).json({ error: "English question not found" });
    }
    const { ordinal: oldOrdinal } = enQRes.rows[0];

    // Update EN
    await pool.query(
      `UPDATE survey_questions 
       SET ordinal = $1, type = $2, prompt = $3, required = $4, updated_at = NOW()
       WHERE id = $5 AND survey_id = 1`,
      [ordinal, type, promptEn, required, id]
    );

    // Update AM (find by same ordinal in survey_id=2)
    await pool.query(
      `UPDATE survey_questions 
       SET ordinal = $1, type = $2, prompt = $3, required = $4, updated_at = NOW()
       WHERE survey_id = 2 AND ordinal = $5`,
      [ordinal, type, promptAm, required, oldOrdinal]
    );

    // Replace options (for both EN + AM)
    await pool.query("DELETE FROM question_options WHERE question_id = $1", [id]);
    const amQRes = await pool.query(
      `SELECT id FROM survey_questions WHERE survey_id = 2 AND ordinal = $1`,
      [ordinal]
    );
    if (amQRes.rows.length > 0) {
      const amId = amQRes.rows[0].id;
      await pool.query("DELETE FROM question_options WHERE question_id = $1", [amId]);

      if (type === "multiple-choice" && options && options.length > 0) {
        for (const option of options) {
          // EN option
          await pool.query(
            `INSERT INTO question_options (question_id, value, label, ordinal) 
             VALUES ($1, $2, $3, $4)`,
            [id, option.value, option.labelEn, option.ordinal]
          );
          // AM option
          await pool.query(
            `INSERT INTO question_options (question_id, value, label, ordinal) 
             VALUES ($1, $2, $3, $4)`,
            [amId, option.value, option.labelAm, option.ordinal]
          );
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete both EN + AM question
export const deleteQuestion = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the EN question
    const enQRes = await pool.query(
      `SELECT ordinal FROM survey_questions WHERE id = $1 AND survey_id = 1`,
      [id]
    );
    if (enQRes.rows.length === 0) {
      return res.status(404).json({ error: "English question not found" });
    }
    const { ordinal } = enQRes.rows[0];

    // Delete EN + AM by ordinal
    // await pool.query("DELETE FROM response_answers WHERE question_id = $1", [id]);
    await pool.query("UPDATE survey_questions SET is_deleted = true WHERE id = $1", [id]);

    const amQRes = await pool.query(
      `SELECT id FROM survey_questions WHERE survey_id = 2 AND ordinal = $1`,
      [ordinal]
    );
    if (amQRes.rows.length > 0) {
      const amId = amQRes.rows[0].id;
      //await pool.query("DELETE FROM response_answers WHERE question_id = $1", [amId]);
      await pool.query("UPDATE survey_questions SET is_deleted = true WHERE id = $1", [amId]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update survey status (English survey 1)
export const updateSurveyStatus = async (req, res) => {
  const { isActive } = req.body;

  try {
    await pool.query("UPDATE surveys SET is_active = $1, updated_at = NOW() WHERE id = 1", [
      isActive,
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating survey status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
