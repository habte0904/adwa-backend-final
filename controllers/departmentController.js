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

// Add department
export const addDepartment = asyncHandler( async (req, res) =>{
    const {department,status} = req.body;

    let exists = false;
    const result = await dbQuery("SELECT COUNT(*) from department where department = $1",[department.toLowerCase()])
    exists = parseInt(result.rows[0].count) > 0;

    if(exists){
      return res.status(409).json({message: "department already exists"});
    }
    else{
      await dbQuery("INSERT INTO department (department,status) VALUES ($1,$2)",[department.toLowerCase(),status]);
      res.status(201).json({message:"department added succussfully!"});
    }

});

// Get department
export const getAllDepartment = asyncHandler( async (req,res) => {
    const result = await dbQuery("SELECT * from department ORDER BY id asc");

    if(!result){
      return res.status(200).json({message:"There is no department!"});
    }

    res.status(200).json(result.rows);

});


// Update department
export const updateDepartment = asyncHandler( async (req,res) => {
    const id = req.params.id;
    const {department,status} = req.body;

    const previousDepartment = await dbQuery("SELECT department from department where id = $1",[id])
    
    if(previousDepartment.rows[0].department === department){
      await dbQuery('UPDATE department SET department = $1, status = $2 where id = $3',[department.toLowerCase(),status,id]);
      res.status(200).json({message: "department updated successfully"});
    }
    else{
      let exists = false;
      const result = await dbQuery("SELECT COUNT(*) from department where department = $1",[department.toLowerCase()]);
      exists = parseInt(result.rows[0].count) > 0;

      if(exists){
        res.status(409).json({message: "department already exists"});
      }
      else{
        await dbQuery('UPDATE department SET department = $1, status = $2 where id = $3',[department.toLowerCase(),status,id]);
        res.status(200).json({message: "department updated successfully"});
      }
  }
   
});

// Delete department
export const deleteDepartment = asyncHandler (async (req,res) => {
  const id = req.params.id
  const result = await dbQuery("DELETE from department where id = $1",[id]);

  if(result.rowCount === 0){
    res.status(204).json({message: "department not found!"})
  }
  else{
    res.status(200).json({message:"department deleted successfully!"});
  }
  
});




