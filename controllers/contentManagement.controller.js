// Content Management Controller for Adwa Museum
import { diskStorage } from "multer";
import pool from "../config/db.config.js";
import { format } from "date-fns";
import { logActivity } from '../services/activityLog.service.js';
import { validateImageFile } from "../utils/imageValidation.js";
import dotenv from 'dotenv';

dotenv.config();
// GET all page content (home, about, exhibition, museum info, social, partners)
export const getAllContent = async (req, res) => {
  try {
    // Home & About Page Content
    const pageContentRes = await pool.query(
      `SELECT * FROM page_content`
    );
    // Mission, Vision, Values
    const mvvRes = await pool.query(
      `SELECT * FROM mission_vision_values WHERE is_active=true ORDER BY display_order ASC, id ASC`
    );
    // Journey Timeline
    const journeyRes = await pool.query(
      `SELECT * FROM journey_timeline WHERE is_active=true ORDER BY date ASC`
    );
    // Image Galleries
    const galleryRes = await pool.query(
      `SELECT * FROM image_galleries WHERE is_active=true ORDER BY display_order ASC, id ASC`
    );
    // Social Media Links
    const socialRes = await pool.query(
      `SELECT * FROM social_media_links WHERE is_active=true ORDER BY display_order ASC, id ASC`
    );
    // Partners
    const partnersRes = await pool.query(
      `SELECT * FROM partners WHERE is_active=true ORDER BY display_order ASC, id ASC`
    );
    // Museum Info
    const museumRes = await pool.query(
      `SELECT * FROM museum_info`
    );

    res.status(200).json({
      pageContent: pageContentRes.rows,
      missionVisionValues: mvvRes.rows,
      journeyTimeline: journeyRes.rows,
      imageGalleries: galleryRes.rows,
      socialMediaLinks: socialRes.rows,
      partners: partnersRes.rows,
      museumInfo: museumRes.rows,
    });  
  } catch (err) {
    console.error("Error fetching content:", err);
    res.status(500).json({ error: "Failed to fetch content" });
  }
};

// UPDATE page content (home, about, exhibition, etc.)
// UPDATE page content (home, about, exhibition, etc.)
export const updatePageContent = async (req, res) => {
  try {
    const { page_name, section_name, title, subtitle, content,title_am,subtitle_am,content_am } = req.body;
    // If file uploaded, use its path, else fallback to body
    let background_image=null
   //background_image = req.file ? `${process.env.BACKEND_BASEURL}/${req.file.path.replace(/\\/g, '/')}` : req.body.background_image || null;
   if(req.file){
    const filePath=await validateImageFile(req.file);
    if(!filePath){
       return res.status(400).json({ error: "Invalid image file uploaded." });
    }
    background_image=`${process.env.BACKEND_BASEURL}/${filePath}`
   } else{
     background_image=req.body.background_image || null;
   }
   
   const result = await pool.query(
      `INSERT INTO page_content (page_name, section_name, title, subtitle, content, background_image, updated_at,title_am,subtitle_am,content_am )
       VALUES ($1, $2, $3, $4, $5, $6, NOW(),$7,$8,$9)
       ON CONFLICT (page_name, section_name)
       DO UPDATE SET title=$3, subtitle=$4, content=$5, background_image=$6, updated_at=NOW(),title_am=$7,subtitle_am=$8,content_am=$9 
       RETURNING *`,
      [page_name, section_name, title, subtitle, content, background_image,title_am,subtitle_am,content_am ]
    );
    res.status(200).json({ ...result.rows[0], file_url: background_image });
      // Audit log: Update/Create page content
      try {
        const userId = req.user?.id || null;
        const userName = req.user?.username || 'Unknown';
        const role = req.user?.roleName || 'Unknown';
        const department = req.user?.department || 'Unknown';
        const action = 'Update Page Content';
        const details = JSON.stringify({ page_name, section_name, title, subtitle, content, background_image,title_am,subtitle_am,content_am  });
        logActivity({ userId, userName, role, department, action, details });
      } catch (e) { console.error('Activity log error:', e); }
  } catch (err) {
    console.error("Error updating page content:", err);
    res.status(500).json({ error: "Failed to update page content" });
  }
};

// UPDATE mission, vision, values
export const updateMissionVisionValue = async (req, res) => {
  try {
    const { id, type, title, description, title_am, description_am, display_order, is_active } = req.body;
    let result;

    const currentIdsResult = await pool.query(
      `SELECT id FROM mission_vision_values WHERE is_active=true`
    );
    const currentIds = currentIdsResult.rows.map(row => row.id);
    
    if (id && currentIds.includes(parseInt(id)) ) {
      result = await pool.query(
        `UPDATE mission_vision_values SET type=$2, title=$3, description=$4, display_order=$5, is_active=$6, title_am=$7, description_am=$8, updated_at=NOW() WHERE id=$1 RETURNING *`,
        [id, type, title, description, display_order, is_active, title_am, description_am]
      );
    } else {
      result = await pool.query(
        `INSERT INTO mission_vision_values (type, title, description, display_order, is_active, title_am, description_am) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [type, title, description, display_order, is_active, title_am, description_am]
      );
    }
    res.status(200).json(result.rows[0]);
      // Audit log: Update/Create mission/vision/value
      try {
        const userId = req.user?.id || null;
        const userName = req.user?.username || 'Unknown';
        const role = req.user?.roleName || 'Unknown';
        const department = req.user?.department || 'Unknown';
        const action = id ? 'Update Mission/Vision/Value' : 'Create Mission/Vision/Value';
        const details = JSON.stringify({ id, type, title, description, display_order, is_active });
        logActivity({ userId, userName, role, department, action, details });
      } catch (e) { console.error('Activity log error:', e); }
  } catch (err) {
    console.error("Error updating mission/vision/value:", err);
    res.status(500).json({ error: "Failed to update mission/vision/value" });
  }
};

// UPDATE journey timeline
export const updateJourneyTimeline = async (req, res) => {
  try {
    const { journeyTimeline } = req.body;

    // Fetch all active timeline IDs from DB
    const currentIdsResult = await pool.query(
      `SELECT id FROM journey_timeline WHERE is_active=true`
    );
    const currentIds = currentIdsResult.rows.map(row => row.id);

    let sentIds = [];

    if (journeyTimeline && journeyTimeline.length > 0) {
      for (let i = 0; i < journeyTimeline.length; i++) {
        const item = journeyTimeline[i];

        if (item.id) {
          sentIds.push(item.id);
          // Update existing timeline
          await pool.query(
            `UPDATE journey_timeline 
             SET date=$2, title=$3, description=$4, image_url=$5, display_order=$6, is_active=$7, title_am=$8, description_am=$9, updated_at=NOW() 
             WHERE id=$1 RETURNING *`,
            [item.id, item.date, item.title, item.description, item.image_url, item.display_order, item.is_active, item.title_am, item.description_am,]
          );
        } else {
          // Insert new timeline
          await pool.query(
            `INSERT INTO journey_timeline (date, title, description, image_url, display_order, is_active, title_am, description_am) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [item.date, item.title, item.description, item.image_url, item.display_order, item.is_active, item.title_am, item.description_am]
          );
        }
      }
    }

    // Find IDs to delete (those in DB but not in sent IDs)
    const idsToDelete = currentIds.filter(id => !sentIds.includes(id));

    if (idsToDelete.length > 0) {
      await pool.query(
        `DELETE FROM journey_timeline WHERE id = ANY($1::int[])`,
        [idsToDelete]
      );
    }

    res.status(200).json({ message: "Successfully updated journey timeline" });
      // Audit log: Update/Create/Delete journey timeline
      try {
        const userId = req.user?.id || null;
        const userName = req.user?.username || 'Unknown';
        const role = req.user?.roleName || 'Unknown';
        const department = req.user?.department || 'Unknown';
        const action = 'Update Journey Timeline';
        const details = JSON.stringify({ journeyTimeline, deletedIds: idsToDelete });
        logActivity({ userId, userName, role, department, action, details });
      } catch (e) { console.error('Activity log error:', e); }
  } catch (err) {
    console.error("Error updating journey timeline:", err);
    res.status(500).json({ error: "Failed to update journey timeline" });
  }
};


// UPDATE image galleries
export const updateImageGallery = async (req, res) => {

  try {
    const { id, page_name, section_name, alt_text, caption, display_order, is_active, title_am, description_am } = req.body;
    // If file uploaded, use its path, else fallback to body
   
    let file_url=null
   //background_image = req.file ? `${process.env.BACKEND_BASEURL}/${req.file.path.replace(/\\/g, '/')}` : req.body.background_image || null;
   if(req.file){
    const filePath=await validateImageFile(req.file);
    if(!filePath){
       return res.status(400).json({ error: "Invalid image file uploaded." });
    }
    file_url=`${process.env.BACKEND_BASEURL}/${filePath}`
   } else{
     file_url=req.body.file_url || null;
   }
    const file_type = req.file ? req.file.mimetype : req.body.file_type || null;
    let result;
    if (id) {
      // Update by id
      result = await pool.query(
        `UPDATE image_galleries SET page_name=$2, section_name=$3, file_url=$4, file_type=$5, alt_text=$6, caption=$7, display_order=$8, is_active=$9, title_am=$10, description_am=$11, updated_at=NOW() WHERE id=$1 RETURNING *`,
        [id, page_name, section_name, file_url, file_type, alt_text, caption, display_order, is_active, title_am, description_am]
      );
    } else {
      // Try to update by display_order, page_name, section_name
      const updateResult = await pool.query(
        `UPDATE image_galleries SET file_url=$1, file_type=$2, alt_text=$3, caption=$4, is_active=$5, title_am=$9, description_am=$10, updated_at=NOW() WHERE page_name=$6 AND section_name=$7 AND display_order=$8 RETURNING *`,
        [file_url, file_type, alt_text, caption, is_active, page_name, section_name, display_order, title_am, description_am]
      );
      if (updateResult.rowCount > 0) {
        result = updateResult;
      } else {
        // If no image exists for this slot, insert new
        result = await pool.query(
          `INSERT INTO image_galleries (page_name, section_name, file_url, file_type, alt_text, caption, display_order, is_active, title_am, description_am) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [page_name, section_name, file_url, file_type, alt_text, caption, display_order, is_active, title_am, description_am]
        );
      }
    }
    res.status(200).json({ ...result.rows[0], file_url });
      // Audit log: Update/Create image gallery
      try {
        const userId = req.user?.id || null;
        const userName = req.user?.username || 'Unknown';
        const role = req.user?.roleName || 'Unknown';
        const department = req.user?.department || 'Unknown';
        const action = id ? 'Update Image Gallery' : 'Create Image Gallery';
        const details = JSON.stringify({ id, page_name, section_name, alt_text, caption, display_order, is_active, file_url, file_type });
        logActivity({ userId, userName, role, department, action, details });
      } catch (e) { console.error('Activity log error:', e); }
  } catch (err) {
    console.error("Error updating image gallery:", err);
    res.status(500).json({ error: "Failed to update image gallery" });
  }
};
export const deleteImg = async( req, res) => {
    const  id = req.params.id;
    try{
      await pool.query(`DELETE from image_galleries WHERE id=$1`,
        [id]
      )
    }catch(err){
      console.log("Error deleting image",err);
    }
    // Audit log: Delete image gallery
    try {
      const userId = req.user?.id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Delete Image Gallery';
      const details = JSON.stringify({ id });
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }
    res.status(200).json({message:"deleted successfully"});
}

// UPDATE social media links
export const updateSocialMediaLink = async (req, res) => {
  try {
    const { id, platform, url, icon_class, display_order, is_active } = req.body;
   
      const result = await pool.query(
        `INSERT INTO social_media_links (platform, url, icon_class, display_order, is_active) VALUES ($1, $2, $3, $4, $5) 
          ON CONFLICT (platform)
          DO UPDATE SET platform = $1, url = $2, icon_class = $3, display_order = $4, is_active = $5
          RETURNING *`,
        [platform, url, icon_class, display_order, is_active]
      );
    
    res.status(200).json(result.rows[0]);
      // Audit log: Update/Create social media link
      try {
        const userId = req.user?.id || null;
        const userName = req.user?.username || 'Unknown';
        const role = req.user?.roleName || 'Unknown';
        const department = req.user?.department || 'Unknown';
        const action = id ? 'Update Social Media Link' : 'Create Social Media Link';
        const details = JSON.stringify({ id, platform, url, icon_class, display_order, is_active });
        logActivity({ userId, userName, role, department, action, details });
      } catch (e) { console.error('Activity log error:', e); }
  } catch (err) {
    console.error("Error updating social media link:", err);
    res.status(500).json({ error: "Failed to update social media link" });
  }
};

// UPDATE partners
export const updatePartner = async (req, res) => {
  try {
    const { id, name,name_am, website_url, description, display_order, is_active } = req.body;
    let {logo_url} = req.body;
    
   
   
   if(req.file){
    const filePath=await validateImageFile(req.file);
    if(!filePath){
       return res.status(400).json({ error: "Invalid image file uploaded." });
    }
    logo_url=`${process.env.BACKEND_BASEURL}/${filePath}`
   } else{
     logo_url=logo_url || null;
   }
    let result;

    const currentIdsResult = await pool.query(
      `SELECT id FROM partners WHERE is_active=true`
    );
    const currentIds = currentIdsResult.rows.map(row => row.id);

    if (id && currentIds.includes(parseInt(id))) {
      result = await pool.query(
        `UPDATE partners SET name=$2, logo_url=$3, website_url=$4, description=$5, display_order=$6, is_active=$7, updated_at=NOW(),name_am=$8 WHERE id=$1 RETURNING *`,
        [id, name, logo_url, website_url, description, display_order, is_active,name_am]
      );
    } else {
      result = await pool.query(
        `INSERT INTO partners (name, logo_url, website_url, description, display_order, is_active, name_am) VALUES ($1, $2, $3, $4, $5, $6,$7) RETURNING *`,
        [name, logo_url, website_url, description, display_order, is_active,name_am]
      );
    }
    res.status(200).json(result.rows[0]);
      // Audit log: Update/Create partner
      try {
        const userId = req.user?.id || null;
        const userName = req.user?.username || 'Unknown';
        const role = req.user?.roleName || 'Unknown';
        const department = req.user?.department || 'Unknown';
        const action = id ? 'Update Partner' : 'Create Partner';
        const details = JSON.stringify({ id, name, logo_url, website_url, description, display_order, is_active,name_am });
        logActivity({ userId, userName, role, department, action, details });
      } catch (e) { console.error('Activity log error:', e); }
  } catch (err) {
    console.error("Error updating partner:", err);
    res.status(500).json({ error: "Failed to update partner" });
  }
};

export const deletePartner = async( req, res) => {
    const id = req.params.id;
    try{
      await pool.query(`DELETE from partners WHERE id =$1`,
        [id]
      )
    }catch(err){
      console.log("Error deleting partner",err);
    }
    // Audit log: Delete partner
    try {
      const userId = req.user?.id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Delete Partner';
      const details = JSON.stringify({ id });
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }
    res.status(200).json({message:"deleted successfully"});
}

export const deleteValues = async( req, res) => {
    const id = req.params.id;
    
    try{
      await pool.query(`DELETE from mission_vision_values WHERE id =$1`,
        [id]
      )
    }catch(err){
      console.log("Error deleting value",err);
    }
    // Audit log: Delete mission/vision/value
    try {
      const userId = req.user?.id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Delete Mission/Vision/Value';
      const details = JSON.stringify({ id });
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }
    res.status(200).json({message:"deleted successfully"});
}
// UPDATE museum info
export const updateMuseumInfo = async (req, res) => {
  try {
    const { setting_key, setting_type, description,setting_key_am,setting_value_am,description_am } = req.body;
    let {setting_value} = req.body;

   
    if(req.file || !setting_value){
      if(req.file){
    const filePath=await validateImageFile(req.file);
    if(!filePath){
       return res.status(400).json({ error: "Invalid image file uploaded." });
    }
    setting_value=`${process.env.BACKEND_BASEURL}/${filePath}`
   } else{
     setting_value=req.body.logo || null;
   }
  }

    
    const result = await pool.query(
      `INSERT INTO museum_info (setting_key, setting_value, setting_type, description, updated_at,setting_key_am,setting_value_am,description_am)
       VALUES ($1, $2, $3, $4, NOW(),$5,$6,$7)
       ON CONFLICT (setting_key)
       DO UPDATE SET setting_value=$2, setting_type=$3, description=$4, updated_at=NOW(),setting_key_am=$5,setting_value_am=$6,description_am=$7
       RETURNING *`,
      [setting_key, setting_value, setting_type, description,setting_key_am,setting_value_am,description_am]
    );
    res.status(200).json(result.rows[0]);
      // Audit log: Update/Create museum info
      try {
        const userId = req.user?.id || null;
        const userName = req.user?.username || 'Unknown';
        const role = req.user?.roleName || 'Unknown';
        const department = req.user?.department || 'Unknown';
        const action = 'Update Museum Info';
        const details = JSON.stringify({ setting_key, setting_value, setting_type, description,setting_key_am,setting_value_am,description_am });
        logActivity({ userId, userName, role, department, action, details });
      } catch (e) { console.error('Activity log error:', e); }
  } catch (err) {
    console.error("Error updating museum info:", err);
    res.status(500).json({ error: "Failed to update museum info" });
  }
};

