export class BindingNameValidator {
  static validate(binding: string): void {
    const validChars = /^[\w.\-]+$/;
    if (!validChars.test(binding)) {
      throw new Error(
        `Binding "${binding}" is not valid. Only lower-case, digits, dot, underscore and minus chars are allowed.`,
      );
    }
  }
}
