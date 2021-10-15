const path = require("path");

// Using the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Using this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// Validation Functions for POST and PUT requests:
function bodyHasDeliverToProperty(req, res, next) {
  const { data = {} } = req.body;

  if (!data.deliverTo || !data.deliverTo.length) {
    next({
      status: 400,
      message: "Order must include a deliverTo property.",
    });
  }

  return next();
}

function bodyHasMobileNumProperty(req, res, next) {
  const { data = {} } = req.body;

  if (!data.mobileNumber || !data.mobileNumber.length) {
    next({
      status: 400,
      message: "Order must include a mobileNumber property.",
    });
  }

  return next();
}

function bodyHasDishesProperty(req, res, next) {
  const { data = {} } = req.body;

  if (!data.dishes || !data.dishes.length || !Array.isArray(data.dishes)) {
    next({
      status: 400,
      message: "Order must include at least one dish.",
    });
  }

  return next();
}

function bodyHasDishQuantityProperty(req, res, next) {
  const { data: { dishes } = [] } = req.body;

  const indexesOfDishesWithoutQuantityProperty = dishes.reduce(
    (acc, dish, index) => {
      if (
        !dish.quantity ||
        !dish.quantity > 0 ||
        typeof dish.quantity !== "number"
      ) {
        acc.push(index);
        return acc;
      }
      return acc;
    },
    []
  );

  if (!indexesOfDishesWithoutQuantityProperty.length) {
    // All dishes have the right quantity property
    return next();
  }

  // If there are dishes without the right quantity property, the following code will run:
  if (indexesOfDishesWithoutQuantityProperty.length > 1) {
    const stringOfDishIndex = indexesOfDishesWithoutQuantityProperty.join(", ");

    next({
      status: 400,
      message: `Dishes ${stringOfDishIndex} must have a quantity that is an integer greater than 0.`,
    });
  }

  next({
    status: 400,
    message: `Dish ${indexesOfDishesWithoutQuantityProperty} must have a quantity that is an integer greater than 0.`,
  });
}

// Validation Function for Read, Update, and Delete functions:
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }

  next({
    status: 404,
    message: `No matching order is found for orderId ${orderId}.`,
  });
}

// Validation Functions for PUT request/Update function:
function bodyIdMatchesRouteId(req, res, next) {
  const { orderId } = req.params;
  const { data = {} } = req.body;

  // The id property is not required in the body of the request, but if it is present it must match :orderId from the route
  if (data.id) {
    if (data.id === orderId) {
      return next();
    }
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${data.id}, Route: ${orderId}`,
    });
  }

  return next();
}

function bodyHasStatusProperty(req, res, next) {
  const { data = {} } = req.body;

  if (!data.status || !data.status.length || data.status === "invalid") {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, or delivered.",
    });
  }

  if (data.status === "delivered") {
    next({
      status: 400,
      message: "A delivered order cannot be changed.",
    });
  }

  return next();
}

// Validation Function for Delete request:
function orderStatusIsPending(req, res, next) {
  const order = res.locals.order;

  if (order.status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending.",
    });
  }

  return next();
}

// Route Handlers:
function destroy(req, res) {
  const { orderId } = req.params;
  const orderIndex = orders.findIndex((order) => order.id === orderId);
  orders.splice(orderIndex, 1);
  res.sendStatus(204);
}

function update(req, res) {
  const { data = {} } = req.body;
  const order = res.locals.order;

  // Creating array of property names
  const existingOrderProperties = Object.getOwnPropertyNames(order);

  for (let i = 0; i < existingOrderProperties.length; i++) {
    let propName = existingOrderProperties[i];

    // If values of same property are not equal, existingDishProperty will
    if (propName !== "id" && order[propName] !== data[propName]) {
      order[propName] = data[propName];
    }
  }
  res.json({ data: order });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function create(req, res) {
  const { data = {} } = req.body;
  const newOrder = {
    ...data,
    id: nextId(),
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function list(req, res) {
  res.json({ data: orders });
}

module.exports = {
  create: [
    bodyHasDeliverToProperty,
    bodyHasMobileNumProperty,
    bodyHasDishesProperty,
    bodyHasDishQuantityProperty,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyIdMatchesRouteId,
    bodyHasStatusProperty,
    bodyHasDeliverToProperty,
    bodyHasMobileNumProperty,
    bodyHasDishesProperty,
    bodyHasDishQuantityProperty,
    update,
  ],
  delete: [orderExists, orderStatusIsPending, destroy],
  list,
};
