import { Router, type IRouter } from "express";
import healthRouter from "./health";
import talentosRouter from "./talentos";

const router: IRouter = Router();

router.use(healthRouter);
router.use(talentosRouter);

export default router;
