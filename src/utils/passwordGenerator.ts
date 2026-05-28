/**
 * Password Generator Utility
 * Generates secure random passwords
 */

export class PasswordGenerator {
  private static readonly UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  private static readonly NUMBERS = '0123456789';
  private static readonly SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  /**
   * Generate a secure random password
   * Default: 12 characters with mix of upper, lower, numbers, and special chars
   */
  static generate(length: number = 12): string {
    const chars =
      PasswordGenerator.UPPERCASE +
      PasswordGenerator.LOWERCASE +
      PasswordGenerator.NUMBERS +
      PasswordGenerator.SPECIAL;

    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars[randomIndex];
    }

    // Ensure at least one of each character type
    return this.shufflePassword(password);
  }

  /**
   * Shuffle password to ensure randomness
   */
  private static shufflePassword(password: string): string {
    const arr = password.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }

  /**
   * Validate password strength
   */
  static validateStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Mật khẩu phải có ít nhất 8 ký tự');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất một chữ cái viết hoa');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất một chữ cái viết thường');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất một chữ số');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default PasswordGenerator;
