import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
  } from 'class-validator';
import passwordSchema from '../../user/tools/password.schema';
  
@ValidatorConstraint({ async: false })
class PasswordIsStrong implements ValidatorConstraintInterface {
  public validate(password: string, _args: ValidationArguments): boolean {
    return passwordSchema.validate(password);
  }

  public defaultMessage(_args: ValidationArguments): string {
    return `forms.error.validator.password.weak`;
  }
}

export function IsPasswordStrong(
  validationOptions?: ValidationOptions,
): (object: object, propertyName: string) => void {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      constraints: [],
      options: validationOptions,
      propertyName: propertyName,
      target: object.constructor,
      validator: PasswordIsStrong,
    });
  };
}
