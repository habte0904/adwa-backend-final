import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique UUID for a given table and column.
 * Keeps generating until the generated UUID is not already used in that column.
 */
export async function generateUniqueUUID(table, column, conn) {
  let unique = false;
  let newId = null;

  while (!unique) {
    newId = uuidv4();

    const result = await conn.query(`SELECT COUNT(*) as count FROM ${table} WHERE ${column} = $1`, [newId]);
    
    const count = result?.rows?.[0]?.count;

    if (count !== undefined && parseInt(count) === 0) {
      unique = true;
    }
  }

  return newId;
}
