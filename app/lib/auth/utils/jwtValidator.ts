import crypto from 'crypto';

interface JWTValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  entropy: number;
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
}

class JWTSecretValidator {
  private readonly MIN_LENGTH = 32; // Minimum 32 characters (256 bits)
  private readonly RECOMMENDED_LENGTH = 64; // Recommended 64 characters (512 bits)
  private readonly MIN_ENTROPY = 3.0; // Minimum entropy per character
  private readonly RECOMMENDED_ENTROPY = 4.0; // Recommended entropy per character

  /**
   * Calculate Shannon entropy of a string
   * Higher entropy indicates more randomness/unpredictability
   */
  private calculateEntropy(str: string): number {
    const frequencies: { [key: string]: number } = {};
    
    // Count character frequencies
    for (const char of str) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }
    
    // Calculate Shannon entropy
    let entropy = 0;
    const length = str.length;
    
    for (const freq of Object.values(frequencies)) {
      const probability = freq / length;
      entropy -= probability * Math.log2(probability);
    }
    
    return entropy;
  }

  /**
   * Check for common weak patterns in JWT secrets
   */
  private checkWeakPatterns(secret: string): string[] {
    const weakPatterns = [
      { pattern: /^(secret|password|key|jwt|token)/i, message: 'Secret starts with common weak word' },
      { pattern: /^(123|abc|test|dev|local)/i, message: 'Secret starts with predictable sequence' },
      { pattern: /(.)\1{3,}/g, message: 'Secret contains repeated character sequences' },
      { pattern: /^[a-zA-Z]+$/, message: 'Secret contains only letters (no numbers/symbols)' },
      { pattern: /^[0-9]+$/, message: 'Secret contains only numbers' },
      { pattern: /^[a-z]+$/, message: 'Secret contains only lowercase letters' },
      { pattern: /^[A-Z]+$/, message: 'Secret contains only uppercase letters' },
      { pattern: /qwerty|password|123456|admin|root/i, message: 'Secret contains common weak words' }
    ];

    const issues: string[] = [];
    for (const { pattern, message } of weakPatterns) {
      if (pattern.test(secret)) {
        issues.push(message);
      }
    }

    return issues;
  }

  /**
   * Determine secret strength based on length, entropy, and patterns
   */
  private determineStrength(secret: string, entropy: number): 'weak' | 'medium' | 'strong' | 'very-strong' {
    const length = secret.length;
    const hasNumbers = /\d/.test(secret);
    const hasLowercase = /[a-z]/.test(secret);
    const hasUppercase = /[A-Z]/.test(secret);
    const hasSymbols = /[^a-zA-Z0-9]/.test(secret);
    
    const characterVariety = [hasNumbers, hasLowercase, hasUppercase, hasSymbols].filter(Boolean).length;

    // Very strong: 64+ chars, high entropy, good variety
    if (length >= this.RECOMMENDED_LENGTH && entropy >= this.RECOMMENDED_ENTROPY && characterVariety >= 3) {
      return 'very-strong';
    }
    
    // Strong: 48+ chars, good entropy, some variety
    if (length >= 48 && entropy >= this.MIN_ENTROPY && characterVariety >= 2) {
      return 'strong';
    }
    
    // Medium: 32+ chars, acceptable entropy
    if (length >= this.MIN_LENGTH && entropy >= this.MIN_ENTROPY) {
      return 'medium';
    }
    
    // Weak: everything else
    return 'weak';
  }

  /**
   * Validate JWT secret comprehensively
   */
  validateSecret(secret?: string): JWTValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if secret exists
    if (!secret) {
      errors.push('JWT_SECRET_KEY environment variable is not set');
      return {
        isValid: false,
        errors,
        warnings,
        entropy: 0,
        strength: 'weak'
      };
    }

    // Check minimum length
    if (secret.length < this.MIN_LENGTH) {
      errors.push(`JWT secret is too short (${secret.length} chars). Minimum required: ${this.MIN_LENGTH} chars`);
    }

    // Calculate entropy
    const entropy = this.calculateEntropy(secret);
    
    // Check entropy
    if (entropy < this.MIN_ENTROPY) {
      errors.push(`JWT secret has insufficient entropy (${entropy.toFixed(2)}). Minimum required: ${this.MIN_ENTROPY}`);
    } else if (entropy < this.RECOMMENDED_ENTROPY) {
      warnings.push(`JWT secret entropy could be improved (${entropy.toFixed(2)}). Recommended: ${this.RECOMMENDED_ENTROPY}+`);
    }

    // Check for weak patterns
    const weakPatterns = this.checkWeakPatterns(secret);
    errors.push(...weakPatterns);

    // Length warnings
    if (secret.length < this.RECOMMENDED_LENGTH && secret.length >= this.MIN_LENGTH) {
      warnings.push(`JWT secret length could be improved (${secret.length} chars). Recommended: ${this.RECOMMENDED_LENGTH}+ chars`);
    }

    // Character variety check
    const hasNumbers = /\d/.test(secret);
    const hasLowercase = /[a-z]/.test(secret);
    const hasUppercase = /[A-Z]/.test(secret);
    const hasSymbols = /[^a-zA-Z0-9]/.test(secret);
    
    const characterTypes = [
      { has: hasNumbers, type: 'numbers' },
      { has: hasLowercase, type: 'lowercase letters' },
      { has: hasUppercase, type: 'uppercase letters' },
      { has: hasSymbols, type: 'symbols' }
    ];

    const missingTypes = characterTypes.filter(t => !t.has).map(t => t.type);
    if (missingTypes.length > 2) {
      warnings.push(`JWT secret could include more character types. Missing: ${missingTypes.join(', ')}`);
    }

    const strength = this.determineStrength(secret, entropy);
    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      entropy,
      strength
    };
  }

  /**
   * Generate a cryptographically secure JWT secret
   */
  generateSecureSecret(length: number = 64): string {
    const randomBytes = crypto.randomBytes(length);
    return randomBytes.toString('base64url'); // URL-safe base64 encoding
  }

  /**
   * Validate and log JWT secret on application startup
   */
  validateOnStartup(): void {
    const secret = process.env.JWT_SECRET_KEY;
    const validation = this.validateSecret(secret);

    console.log('\n🔐 JWT Secret Validation Results:');
    console.log(`   Strength: ${validation.strength.toUpperCase()}`);
    console.log(`   Entropy: ${validation.entropy.toFixed(2)} bits per character`);
    
    if (validation.errors.length > 0) {
      console.error('\n❌ JWT Secret Validation ERRORS:');
      validation.errors.forEach(error => console.error(`   - ${error}`));
      
      console.error('\n🚨 CRITICAL: Application startup blocked due to insecure JWT secret!');
      console.error('   Please set a strong JWT_SECRET_KEY environment variable.');
      console.error(`   You can generate one using: node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"`);
      
      process.exit(1); // Exit application if JWT secret is invalid
    }

    if (validation.warnings.length > 0) {
      console.warn('\n⚠️  JWT Secret Validation WARNINGS:');
      validation.warnings.forEach(warning => console.warn(`   - ${warning}`));
    }

    if (validation.isValid) {
      console.log('✅ JWT secret validation passed\n');
    }
  }
}

export const jwtValidator = new JWTSecretValidator();
