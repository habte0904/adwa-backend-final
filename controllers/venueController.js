import pool from "../config/db.config.js";
import asyncHandler from "express-async-handler";

// Utility function for querying PostgreSQL
const dbQuery = async (sql, values = []) => {
  try {
    const result = await pool.query(sql, values);
    return result;
  } catch (err) {
    throw err;
  }
};

// Add venue
export const addVenue = asyncHandler( async (req, res) =>{
    const {venue, venue_am, status} = req.body;

    let exists = false;
    const result = await dbQuery("SELECT COUNT(*) from venue_schedule where venue = $1",[venue.toLowerCase()])
    exists = parseInt(result.rows[0].count) > 0;

    if(exists){
      return res.status(409).json({message: "venue already exists"});
    }
    else{
      await dbQuery("INSERT INTO venue_schedule (venue, status, venue_am) VALUES ($1, $2, $3)",[venue.toLowerCase(), status, venue_am]);
      res.status(201).json({message:"venue added succussfully!"});
    }

});

// Get venue
export const getAllVenue = asyncHandler( async (req,res) => {
    const result = await dbQuery("SELECT * from venue_schedule where is_deleted = false ORDER BY venue_id asc");

    if(!result){
      res.status(200).json({message:"There is no venue!"});
    }

    res.status(200).json(result.rows);

});
export const getAllVenueEvent = asyncHandler( async (req,res) => {

    const result = await dbQuery(`SELECT * from venue_schedule where is_deleted = false AND status = 'Active' ORDER BY venue_id asc`);

    if(!result){
      res.status(200).json({message:"There is no venue!"});
    }

    res.status(200).json(result.rows);

});

// Get specific venue
export const getSpecificVenue = asyncHandler( async (req, res) => {
    const venue = req.body.venue;
   
    const venue_id = await dbQuery("SELECT venue_id from venue_schedule where venue = $1",[venue])

    if(venue_id.rowCount === 0){
      res.status(200).json({message:"no venue is found!"});
    }
    else{
      res.status(200).json(venue_id.rows);
    }

});

// Update venue
export const updateVenue = asyncHandler( async (req,res) => {
    const venue_id = req.params.venue_id;
    const {venue, status, venue_am} = req.body;
    const normalizedStatus = (status || 'active').toLowerCase();
    const previousVenue = await dbQuery("SELECT venue from venue_schedule where venue_id = $1",[venue_id])

    if(previousVenue.rows[0].venue === venue){
      await dbQuery('UPDATE venue_schedule SET venue = $1, status = $2, venue_am = $4 where venue_id = $3',[venue.toLowerCase(), status, venue_id, venue_am]);
       // Update related service_facility status
    const serviceFacilityRes = await dbQuery(
      `UPDATE service_facility
       SET status = $1
       FROM service_category sc
       WHERE service_facility.category_id = sc.id
       AND service_facility.venue_id = $2
       AND sc.status = 'active'`,
      [normalizedStatus, venue_id]
    );
      return res.status(200).json({message: "venue updated successfully"});
    }

    else{
      let exists = false;
      const result = await dbQuery("SELECT COUNT(*) from venue_schedule where venue = $1",[venue.toLowerCase()]);
      exists = parseInt(result.rows[0].count) > 0;

      if(exists){
       return res.status(409).json({message: "venue already exists"});
      }
      else{
        await dbQuery('UPDATE venue_schedule SET venue = $1, status = $2, venue_am = $4 where venue_id = $3',[venue.toLowerCase(), status, venue_id, venue_am]);
         // Update related service_facility status
    const serviceFacilityRes=await dbQuery(
      'UPDATE service_facility SET status = $1 WHERE venue_id = $2',
      [normalizedStatus, venue_id]
    );
    if (serviceFacilityRes.rowCount === 0) {
      return res.status(404).json({ error: 'Service category not found' });
    }
       return res.status(200).json({message: "venue updated successfully"});
      }
  }

  

   
   
});

export const deleteVenue = asyncHandler (async (req,res) => {
  const venue_id = req.params.venue_id
  const deleteEventRes = await dbQuery("update event  set is_deleted=true where venue_id = $1",[venue_id]);
 

  const serviceFacilityRes = await dbQuery("update service_facility  set is_deleted=true where venue_id = $1",[venue_id]);
  
  const deleteUnavailableDatesRes = await dbQuery("DELETE from unavailable_dates where venue_id = $1",[venue_id]);
  
  const result = await dbQuery("update venue_schedule set is_deleted =true where venue_id = $1",[venue_id]);

  if(result.rowCount === 0){
    res.status(400).json({message: "Venue not found!"})
  }
  else{
    res.status(200).json({message:"Venue deleted successfully!"});
  }
  
});




