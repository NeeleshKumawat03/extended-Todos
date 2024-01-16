const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')

const {format, compareAsc} = require('date-fns')
const isValid = require('date-fns/isValid')

let db = null
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('server is started at port 3000')
    })
  } catch (err) {
    console.log(err)
  }
}

initializeDbAndServer()

// API 1
app.get('/todos', async (req, res) => {
  const {status, priority, search_q, category} = req.query
  // console.log(status)

  let statusQuery
  if (status) {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      statusQuery = `
        SELECT * FROM todo 
        WHERE status = '${status}';
      `
    } else {
      // console.log('Hii')
      res.status(400)
      res.send('Invalid Todo Status')
    }
  } else if (priority) {
    if (priority === 'LOW' || priority === 'MEDIUM' || priority === 'HIGH') {
      statusQuery = `
        SELECT * FROM todo 
        WHERE priority = '${priority}';
      `
    } else {
      res.status(400)
      res.send('Invalid Todo Priority')
    }
  } else if (search_q) {
    statusQuery = `
      SELECT * FROM todo WHERE todo LIKE '%${search_q}%';
    `
  } else if (category) {
    if (category === 'WORK' || category === 'HOME' || category === 'LEARNING') {
      statusQuery = `
        SELECT * FROM todo WHERE category = '${category}';
      `
    } else {
      res.status(400)
      res.send('Invalid Todo Category')
    }
  }

  if (statusQuery) {
    const todoStatus = await db.all(statusQuery)
    res.send(
      todoStatus.map(todo => {
        return {
          id: todo.id,
          todo: todo.todo,
          priority: todo.priority,
          status: todo.status,
          category: todo.category,
          dueDate: todo.due_date,
        }
      }),
    )
  }
})

// API 2
app.get('/todos/:todoId', async (req, res) => {
  const {todoId} = req.params

  const sqlQuery = `
    SELECT * FROM todo WHERE id = ${todoId};
  `

  const todo = await db.get(sqlQuery)
  res.send({
    id: todo.id,
    todo: todo.todo,
    priority: todo.priority,
    status: todo.status,
    category: todo.category,
    dueDate: todo.due_date,
  })
})

// API 3
app.get('/agenda', async (req, res) => {
  let {date} = req.query
  if (!isValid(new Date(date))) {
    // console.log('o')
    res.status(400)
    res.send('Invalid Due Date')
  } else {
    date = new Date(date)
    const newDate = format(new Date(date), 'yyyy/MM/dd')
    // console.log(typeof newDate)

    const sqlQuery = `
    SELECT * FROM todo WHERE due_date = ${newDate};
  `

    const todos = await db.all(sqlQuery)
    res.send(
      todos.map(todo => {
        return {
          id: todo.id,
          todo: todo.todo,
          priority: todo.priority,
          status: todo.status,
          category: todo.category,
          dueDate: todo.due_date,
        }
      }),
    )
  }
})

// API 4
app.post('/todos', async (req, res) => {
  const {id, todo, priority, status, category, dueDate} = req.body
  let isAllValid = true
  if (
    !(status === 'TO DO') &&
    !(status === 'IN PROGRESS') &&
    !(status === 'DONE')
  ) {
    // console.log('H')
    isAllValid = false
    res.status(400)
    res.send('Invalid Todo Status')
  } else if (
    !(priority === 'LOW') &&
    !(priority === 'MEDIUM') &&
    !(priority === 'HIGH')
  ) {
    // console.log('e')
    isAllValid = false
    res.status(400)
    res.send('Invalid Todo Priority')
  } else if (
    !(category === 'WORK') &&
    !(category === 'HOME') &&
    !(category === 'LEARNING')
  ) {
    // console.log('l')
    isAllValid = false
    res.status(400)
    res.send('Invalid Todo Category')
  } else if (!isValid(new Date(dueDate))) {
    // console.log('o')
    isAllValid = false
    res.status(400)
    res.send('Invalid Due Date')
  }
  console.log(isAllValid)

  if (isAllValid) {
    const sqlQuery = `
    INSERT INTO todo(id, todo, priority, status, category, due_date)
    VALUES(${id}, '${todo}', '${priority}', '${status}', '${category}', ${dueDate});
  `

    await db.run(sqlQuery)
    res.send('Todo Successfully Added')
  }
})

// API 5
app.put('/todos/:todoId', async (req, res) => {
  const {todoId} = req.params

  const {status, priority, todo, category, dueDate} = req.body

  let sqlQuery

  if (status) {
    if (
      !(status === 'TO DO') &&
      !(status === 'IN PROGRESS') &&
      !(status === 'DONE')
    ) {
      // console.log('H')
      res.status(400)
      res.send('Invalid Todo Status')
    } else {
      sqlQuery = `
      UPDATE todo
      SET 
        status = '${status}'
      WHERE id = ${todoId};
    `
      await db.run(sqlQuery)
      res.send('Status Updated')
    }
  } else if (priority) {
    if (
      !(priority === 'LOW') &&
      !(priority === 'MEDIUM') &&
      !(priority === 'HIGH')
    ) {
      // console.log('e')
      res.status(400)
      res.send('Invalid Todo Priority')
    } else {
      sqlQuery = `
      UPDATE todo 
      SET
        priority = '${priority}'
      WHERE id = ${todoId};
    `
      await db.run(sqlQuery)
      res.send('Priority Updated')
    }
  } else if (todo) {
    sqlQuery = `
      UPDATE todo 
      SET 
        todo = '${todo}'
      WHERE id = ${todoId};
    `
    await db.run(sqlQuery)
    res.send('Todo Updated')
  } else if (category) {
    if (
      !(category === 'WORK') &&
      !(category === 'HOME') &&
      !(category === 'LEARNING')
    ) {
      // console.log('l')
      res.status(400)
      res.send('Invalid Todo Category')
    } else {
      sqlQuery = `
    
      UPDATE todo
      SET 
        category = '${category}'
      WHERE id = ${todoId};
    `
      await db.run(sqlQuery)
      res.send('Category Updated')
    }
  } else {
    if (!isValid(new Date(dueDate))) {
      // console.log('o')
      res.status(400)
      res.send('Invalid Due Date')
    } else {
      sqlQuery = `
      UPDATE todo
      SET 
        due_date = '${dueDate}'
      WHERE id = ${todoId};
    `

      await db.run(sqlQuery)
      res.send('Due Date Updated ')
    }
  }
})

// API 6
app.delete('/todos/:todoId', async (req, res) => {
  const {todoId} = req.params

  const sqlQuery = `
    DELETE FROM todo 
    WHERE id = ${todoId};
  `

  await db.run(sqlQuery)
  res.send('Todo Deleted')
})

module.exports = app
