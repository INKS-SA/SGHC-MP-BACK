const contractPlansRouter = require('express').Router()
const ContractPlan = require('../models/ContractPlan')
const multer = require('multer')
const path = require('path')

const authMiddleware = require('../middleware/authMiddleware') // Importa el middleware de autenticación

// Aplica el middleware a todas las rutas
contractPlansRouter.use(authMiddleware)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/uploads') // Guardar en la carpeta principal uploads
  },
  filename: (req, file, cb) => {
    cb(null, `contract-${Date.now()}${path.extname(file.originalname)}`)
  }
})

const upload = multer({ storage })

contractPlansRouter.get('/treatment/:treatmentId', async (req, res) => {
  try {
    const contract = await ContractPlan.findOne({
      treatmentPlan: req.params.treatmentId
    })

    if (!contract) {
      return res.status(404).json({
        error: 'No existe contrato para esta planificación'
      })
    }

    // Añadir URL completa del archivo
    const contractWithFileUrl = {
      ...contract._doc,
      contractFileUrl: `${req.protocol}://${req.get('host')}/uploads/${contract.contractFile}`
    }

    res.json(contractWithFileUrl)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el contrato' })
  }
})

// contractPlans.js
contractPlansRouter.get('/download/:id', async (req, res) => {
  try {
    const contract = await ContractPlan.findById(req.params.id)
    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' })
    }

    const filePath = path.join(__dirname, '..', 'uploads', contract.contractFile)
    res.download(filePath)
  } catch (error) {
    res.status(500).json({ error: 'Error al descargar el contrato' })
  }
})

contractPlansRouter.post('/:treatmentId', upload.single('contractFile'), async (req, res) => {
  try {
    console.log('File:', req.file)
    console.log('TreatmentId:', req.params.treatmentId)

    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' })
    }

    const contractFile = req.file.filename
    const treatmentId = req.params.treatmentId

    const contract = new ContractPlan({
      treatmentPlan: treatmentId,
      contractFile
    })

    const savedContract = await contract.save()
    console.log('Saved contract:', savedContract)

    res.status(201).json(savedContract)
  } catch (error) {
    console.error('Error completo:', error)
    res.status(500).json({ error: 'Error al guardar el contrato' })
  }
})

contractPlansRouter.put('/:treatmentId', upload.single('contractFile'), async (req, res) => {
  try {
    console.log('File:', req.file)
    console.log('TreatmentId:', req.params.treatmentId)

    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' })
    }

    const treatmentId = req.params.treatmentId
    const newContractFile = req.file.filename

    const existingContract = await ContractPlan.findOne({
      treatmentPlan: treatmentId
    })

    if (!existingContract) {
      return res.status(404).json({ error: 'Contrato no encontrado' })
    }

    existingContract.contractFile = newContractFile
    const updatedContract = await existingContract.save()
    console.log('Updated contract:', updatedContract)

    const contractWithFileUrl = {
      ...updatedContract._doc,
      contractFileUrl: `${req.protocol}://${req.get('host')}/uploads/${updatedContract.contractFile}`
    }

    res.json(contractWithFileUrl)
  } catch (error) {
    console.error('Error completo:', error)
    res.status(500).json({ error: 'Error al actualizar el contrato' })
  }
})

module.exports = contractPlansRouter
