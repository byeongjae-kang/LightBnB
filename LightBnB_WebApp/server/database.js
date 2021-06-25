const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');
const pool = new Pool({
  user: 'byeongjae',
  password: 'postgres',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then(user => {
      return user.rows[0];
    })
    .catch(err => {
      console.log(err);
      return null;
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
    .then(user => {
      return user.rows[0];
    })
    .catch(err => {
      console.log(err);
      return null;
    });
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool
    .query(`
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3) 
      RETURNING *;
      `, [user.name, user.email, user.password])
    .then(user => {
      return user.rows[0];
    })
    .catch(err => {
      console.log(err);
      return null;
    });
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query(`
      SELECT * 
      FROM reservations 
      JOIN properties ON property_id = properties.id
      WHERE guest_id = $1 
      AND end_date < now() 
      LIMIT $2;
      `, [guest_id, limit])
    .then(user => {
      return user.rows;
    })
    .catch(err => {
      console.log(err);
      return null;
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  const { city, minimum_price_per_night, maximum_price_per_night, minimum_rating } = options;
  const queryParams = [];

  let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
    `;
  
  if (city) {
    queryParams.push(`%${city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }
  if (minimum_price_per_night) {
    queryParams.push(minimum_price_per_night);
    if (queryParams.length > 1) {
      queryString += `AND properties.cost_per_night >= $${queryParams.length} `;
    } else {
      queryString += `WHERE properties.cost_per_night >= $${queryParams.length} `;
    }
  }
  if (maximum_price_per_night) {
    queryParams.push(maximum_price_per_night);
    if (queryParams.length > 1) {
      queryString += `AND properties.cost_per_night <= $${queryParams.length} `;
    } else {
      queryString += `WHERE properties.cost_per_night <= $${queryParams.length} `;
    }
  }
  if (minimum_rating) {
    queryParams.push(minimum_rating);
    if (queryParams.length > 1) {
      queryString += `AND property_reviews.rating >= $${queryParams.length} `;
    } else {
      queryString += `WHERE property_reviews.rating >= $${queryParams.length} `;
    }
  }
  
  queryParams.push(limit);

  queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;

  return pool
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const queryParams = [];
  for (const key in property) {
    if (key === 'cost_per_night' || key === 'parking_spaces' || key === 'number_of_bathrooms' || key ===  'number_of_bedrooms') {
      queryParams.push(parseInt(property[key]) || 0);
    } else {
      queryParams.push(property[key]);
    }
  }
  const queryString = `
    INSERT INTO properties (title, description, number_of_bedrooms, number_of_bathrooms, parking_spaces, cost_per_night, thumbnail_photo_url, cover_photo_url, street, country, city, province, post_code, owner_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
    `;
  
  return pool
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });

};
exports.addProperty = addProperty;
