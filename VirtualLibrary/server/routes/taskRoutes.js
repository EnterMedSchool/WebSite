const router = require('express').Router()
const taskController = require('../controllers/taskController')
router.route('/').post(taskController.create).get(taskController.getAll)
router
    .route('/:id')
    .get(taskController.getTask)
    .patch(taskController.update)
    .delete(taskController.delete)

module.exports = router
