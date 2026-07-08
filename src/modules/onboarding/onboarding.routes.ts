import { Router } from 'express';
import { onboardingController } from './onboarding.controller';
import { authenticate } from '../../../middlewares/authenticate';
import { artisanOnly } from '../../../middlewares/artisanOnly';
import { validate } from '../../../middlewares/validate';
import { imageUpload } from './upload';
import {
  personalSchema,
  businessSchema,
  skillsSchema,
  servicesSchema,
  availabilitySchema,
  studentVerificationSchema,
  portfolioMetadataSchema,
  addPortfolioItemSchema,
} from './onboarding.validators';

const router = Router();

router.use(authenticate, artisanOnly);

router.get('/status', onboardingController.getStatus);
router.patch('/personal', validate(personalSchema), onboardingController.updatePersonal);
router.patch('/business', validate(businessSchema), onboardingController.updateBusiness);
router.patch('/skills', validate(skillsSchema), onboardingController.updateSkills);
router.patch('/services', validate(servicesSchema), onboardingController.updateServices);
router.patch('/availability', validate(availabilitySchema), onboardingController.updateAvailability);

router.get('/portfolio', onboardingController.listPortfolio);
router.post(
  '/portfolio',
  imageUpload.single('image'),
  validate(addPortfolioItemSchema),
  onboardingController.addPortfolioItem
);
router.patch('/portfolio', validate(portfolioMetadataSchema), onboardingController.updatePortfolio);
router.delete('/portfolio/:id', onboardingController.removePortfolioItem);

router.patch(
  '/student-verification',
  imageUpload.single('image'),
  validate(studentVerificationSchema),
  onboardingController.updateStudentVerification
);

router.post('/submit', onboardingController.submit);

export const onboardingRouter = router;
