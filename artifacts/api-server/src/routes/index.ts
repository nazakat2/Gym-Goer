import { Router, type IRouter } from "express";
import healthRouter from "./health";
import gymRouter from "./gym";
import gymAdminRouter from "./gym-admin";
import chatbotRouter from "./chatbot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatbotRouter);
router.use(gymAdminRouter);
router.use(gymRouter);

export default router;
