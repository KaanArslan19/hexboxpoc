import * as Yup from "yup";
import { FundingType } from "@/app/types";

// File size limit constant
export const FILE_SIZE_LIMIT = 1024 * 1024 * 5; // 5MB in bytes

// File size validator
export const fileSizeValidator = Yup.mixed().test(
  "fileSize",
  "File size must be less than 5MB",
  (value: unknown) => {
    if (value instanceof File) {
      return value.size <= FILE_SIZE_LIMIT;
    }
    return true;
  }
);

// Individual field validation schemas for reusability
export const campaignFieldValidators = {
  title: Yup.string()
    .max(60, "Title must be 60 characters or less")
    .required("Title is required"),

  one_liner: Yup.string()
    .max(80, "One Liner must be 80 characters or less")
    .required("One Liner is required"),

  logo: fileSizeValidator.required("Logo is required"),

  description: Yup.string()
    .max(10000, "Description must be 10000 characters or less")
    .required("Description is required"),

  location: Yup.string()
    .max(60, "Location must be 60 characters or less")
    .required("Location is required"),

  deadline: Yup.date()
    .required("Project Deadline date is required")
    .min(new Date(), "Deadline must be in the future"),

  email: Yup.string()
    .email("Invalid email format")
    .max(60, "Email must be 60 characters or less")
    .required("Email is required"),

  phoneNumber: Yup.string()
    .matches(
      /^\+?[0-9]{1,4}[0-9\s.-]{5,}$/,
      "Please enter a valid phone number (e.g., +123 456789012 +44 7911 123456)"
    )
    .max(20, "Phone Number must be 20 characters or less")
    .required("Phone Number is required"),

  website: Yup.string()
    .url(
      "Website must be a valid URL format (e.g., https://example.com, https://example.ai)"
    )
    .max(100, "Website URL must be 100 characters or less"),

  discord: Yup.string()
    .url(
      "Discord must be a valid URL format (e.g., https://discord.gg/example)"
    )
    .max(100, "Discord URL must be 100 characters or less"),

  telegram: Yup.string()
    .url("Telegram must be a valid URL format (e.g., https://t.me/example)")
    .max(100, "Telegram URL must be 100 characters or less"),

  linkedIn: Yup.string()
    .url(
      "LinkedIn must be a valid URL format (e.g., https://linkedin.com/in/example)"
    )
    .max(100, "LinkedIn URL must be 100 characters or less"),

  fundAmount: Yup.number()
    .typeError("Fund amount must be a number")
    .required("Fund amount is required")
    .min(0.0000001, "Fund amount must be greater than 0")
    .max(10000, "Fund amount must be less than 10,000"),

  wallet_address: Yup.string()
    .max(42, "Wallet address must be 42 characters or less")
    .matches(
      /^0x[a-fA-F0-9]{40}$/,
      "Wallet address must be a valid EVM address"
    )
    .required("Wallet address is required"),

  funding_type: Yup.string()
    .oneOf(Object.values(FundingType))
    .required("Please select a funding type"),

  acceptTerms: Yup.boolean()
    .oneOf([true], "You must accept the terms and conditions to proceed")
    .required("You must accept the terms and conditions"),

  funds_management: Yup.string()
    .max(1000, "Funds management description must be 1000 characters or less")
    .required("Funds management description is required"),
};

// Step-by-step validation schemas for frontend form (matches existing structure)
export const campaignFormValidationSchemas = [
  // Step 1: Project Info
  Yup.object({
    title: campaignFieldValidators.title,
    one_liner: campaignFieldValidators.one_liner,
    logo: campaignFieldValidators.logo,
  }),

  // Step 2: Description
  Yup.object({
    description: campaignFieldValidators.description,
    location: campaignFieldValidators.location,
    deadline: campaignFieldValidators.deadline,
    email: campaignFieldValidators.email,
    phoneNumber: campaignFieldValidators.phoneNumber,
    website: campaignFieldValidators.website,
    discord: campaignFieldValidators.discord,
    telegram: campaignFieldValidators.telegram,
    linkedIn: campaignFieldValidators.linkedIn,
  }),

  // Step 3: Financial Supply
  Yup.object({
    fundAmount: campaignFieldValidators.fundAmount,
    wallet_address: campaignFieldValidators.wallet_address,
    funds_management: campaignFieldValidators.funds_management,
  }),

  // Step 4: Funding Type
  Yup.object({
    funding_type: campaignFieldValidators.funding_type,
  }),

  // Step 5: Review
  Yup.object({
    funding_type: campaignFieldValidators.funding_type,
    acceptTerms: campaignFieldValidators.acceptTerms,
  }),
];

// Draft validation schema for API endpoint (very lenient - allows incomplete data)
export const campaignDraftValidationSchema = Yup.object()
  .shape({
    title: Yup.string()
      .trim()
      .max(60, "Title must be 60 characters or less")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    description: Yup.string()
      .max(10000, "Description must be 10000 characters or less")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    email: Yup.string()
      .transform((value) => (value === "" ? null : value))
      .nullable()
      .test("email-format", "Invalid email format", function (value) {
        if (!value) return true; // Allow empty/null
        return Yup.string().email().isValidSync(value) && value.length <= 60;
      }),
    phoneNumber: Yup.string()
      .transform((value) => (value === "" ? null : value))
      .nullable()
      .test(
        "phone-format",
        "Please enter a valid phone number",
        function (value) {
          if (!value) return true; // Allow empty/null
          return /^\+?[0-9]{1,4}[0-9\s.-]{5,}$/.test(value);
        }
      ),
    fundAmount: Yup.number()
      .transform((value) =>
        isNaN(value) || value === "" || value === null ? null : value
      )
      .nullable()
      .test(
        "fund-range",
        "Fund amount must be positive and less than 10K",
        function (value) {
          if (value === null || value === undefined || value === 0) return true; // Allow empty/null/zero for drafts
          return value > 0 && value <= 10000;
        }
      ),
    logo: Yup.mixed().nullable(), // Can be File object, string path, or null
    deadline: Yup.string()
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    location: Yup.string()
      .max(60, "Location must be 60 characters or less")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    wallet_address: Yup.string()
      .transform((value) => (value === "" ? null : value))
      .nullable()
      .test(
        "wallet-format",
        "Wallet address must be a valid EVM address",
        function (value) {
          if (!value) return true; // Allow empty/null
          return /^0x[a-fA-F0-9]{40}$/.test(value);
        }
      ),
    one_liner: Yup.string()
      .max(80, "One Liner must be 80 characters or less")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    telegram: Yup.string()
      .transform((value) => (value === "" ? null : value))
      .nullable()
      .test(
        "telegram-url",
        "Telegram must be a valid URL format",
        function (value) {
          if (!value) return true; // Allow empty/null
          return Yup.string().url().max(100).isValidSync(value);
        }
      ),
    discord: Yup.string()
      .transform((value) => (value === "" ? null : value))
      .nullable()
      .test(
        "discord-url",
        "Discord must be a valid URL format",
        function (value) {
          if (!value) return true; // Allow empty/null
          return Yup.string().url().max(100).isValidSync(value);
        }
      ),
    website: Yup.string()
      .transform((value) => (value === "" ? null : value))
      .nullable()
      .test(
        "website-url",
        "Website must be a valid URL format (e.g., https://example.com, https://example.ai)",
        function (value) {
          if (!value) return true; // Allow empty/null
          return Yup.string().url().max(100).isValidSync(value);
        }
      ),
    linkedIn: Yup.string()
      .transform((value) => (value === "" ? null : value))
      .nullable()
      .test(
        "linkedin-url",
        "LinkedIn must be a valid URL format",
        function (value) {
          if (!value) return true; // Allow empty/null
          return Yup.string().url().max(100).isValidSync(value);
        }
      ),
    funding_type: Yup.string()
      .transform((value) => (value === "" ? null : value))
      .nullable()
      .test("funding-type-valid", "Invalid funding type", function (value) {
        if (!value) return true; // Allow empty/null
        return Object.values(FundingType).includes(value as FundingType);
      }),
    acceptTerms: Yup.boolean().nullable(),
    funds_management: Yup.string()
      .max(1000, "Funds management description must be 1000 characters or less")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
  })
  .noUnknown(false); // Allow additional fields for future extensibility

// Initial values for the form
export const campaignFormInitialValues = {
  title: "",
  description: "",
  email: "",
  phoneNumber: "",
  fundAmount: 0,
  logo: null,
  deadline: "",
  location: "",
  wallet_address: "",
  one_liner: "",
  telegram: "",
  discord: "",
  website: "",
  linkedIn: "",
  funding_type: FundingType.Limitless,
  funds_management: "",
  acceptTerms: false,
  turnstileToken: "",
};
