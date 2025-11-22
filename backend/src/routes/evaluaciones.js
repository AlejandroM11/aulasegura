import { Router } from "express";
import { 
  getAllExams, 
  createExam, 
  updateExam, 
  deleteExam, 
  getExamByCode 
} from "../controllers/evaluacionesController.js";

const router = Router();

// Obtener todos los exámenes
router.get("/", getAllExams);

// Crear examen
router.post("/", createExam);

// Obtener examen por código (NUEVO)
router.get("/code/:code", getExamByCode);

// Actualizar examen
router.put("/:id", updateExam);

// Eliminar examen
router.delete("/:id", deleteExam);

export default router;