// eslint-disable-next-line
import PasswordValidator =require('password-validator');

const passwordSchema: any = new PasswordValidator();
export default passwordSchema
  .is()
  .min(8)
  .is()
  .max(100)
  .has()
  .uppercase()
  .has()
  .lowercase()
  .has()
  .symbols()
  .has()
  .digits()
  .has()
  .not()
  .spaces();
