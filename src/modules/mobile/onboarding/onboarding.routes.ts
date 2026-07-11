import { Router } from 'express';
import { onboardingController } from './onboarding.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireRole } from '../../../middlewares/requireRole';
import { validate } from '../../../middlewares/validate';
import {
  personalSchema,
  businessSchema,
  skillsSchema,
  servicesSchema,
  availabilitySchema,
  portfolioSchema,
  verificationSchema,
  submitSchema,
  categoriesSchema,
} from './onboarding.validators';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['artisan']));

router.get('/', onboardingController.getStatus);

router.patch('/personal', validate(personalSchema), onboardingController.updatePersonal);
router.patch('/business', validate(businessSchema), onboardingController.updateBusiness);
router.patch('/skills', validate(skillsSchema), onboardingController.updateSkills);
router.patch('/services', validate(servicesSchema), onboardingController.updateServices);
router.patch('/availability', validate(availabilitySchema), onboardingController.updateAvailability);
router.patch('/portfolio', validate(portfolioSchema), onboardingController.updatePortfolio);
router.patch('/verification', validate(verificationSchema), onboardingController.updateVerification);
router.patch('/categories', validate(categoriesSchema), onboardingController.updateCategories);

router.post('/submit', validate(submitSchema), onboardingController.submitApplication);
router.get('/history', onboardingController.getHistory);

export const onboardingRouter = router;
