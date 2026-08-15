import { Router, type IRouter } from "express";
import healthRouter from "./health";
import talentosRouter from "./talentos";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requireAuth);
router.use(talentosRouter);

export default router;
