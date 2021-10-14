const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

// Validation Functions for POST request:
function bodyHasNameProperty(req, res, next) {
  const { data = {} } = req.body;
  if (!data.name || !data.name.length) {
    next({
      status: 400,
      message: "Dish must include a name.",
    });
  }
  return next();
}

function bodyHasDescriptionProperty(req, res, next) {
  const { data = {} } = req.body;
  if (!data.description || !data.description.length) {
    next({
      status: 400,
      message: "Dish must include a description.",
    });
  }
  return next();
}

function bodyHasPriceProperty(req, res, next) {
  const { data = {} } = req.body;
  if (!data.price || data.price < 0 || typeof(data.price) !== "number") {
    next({
      status: 400,
      message:
        "Dish must include a price and it must be an integer greater than 0.",
    });
  }
  return next();
}

function bodyHasImageUrlProperty(req, res, next) {
  const { data = {} } = req.body;
  if (!data["image_url"] || !data["image_url"].length) {
    next({
      status: 400,
      message: "Dish must include a image_url",
    });
  }
  return next();
}

// Validation Function for GET /dishes/:dishId
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

// Validation Function for PUT /dishes/:dishId
function bodyIdMatchesRouteId(req, res, next) {
  const { dishId } = req.params;
  const { data = {} } = req.body;
  if (data.id) {
    if (data.id === dishId) {
      return next();
    }
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${data.id}, Route: ${dishId}`,
    });
  }
  return next();
}

function update(req, res) {
    const dish = res.locals.dish;
    const { data = {} } = req.body;

    // Creating array of property names
    const existingDishProperties = Object.getOwnPropertyNames(dish);

    for (let i = 0; i < existingDishProperties.length; i++) {
      let propName = existingDishProperties[i];
  
      // If values of same property are not equal, existingDishProperty will
      if (dish[propName] !== data[propName]) {
        dish[propName] = data[propName];
      }
    }
    res.json({ data: dish });
}

function create(req, res) {
  const { data = {} } = req.body;
  const newDish = {
    ...data,
    id: nextId(),
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function list(req, res) {
  res.json({ data: dishes });
}

module.exports = {
  list,
  create: [
    bodyHasNameProperty,
    bodyHasDescriptionProperty,
    bodyHasPriceProperty,
    bodyHasImageUrlProperty,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    bodyIdMatchesRouteId,
    bodyHasNameProperty,
    bodyHasDescriptionProperty,
    bodyHasPriceProperty,
    bodyHasImageUrlProperty,
    update,
  ],
};
