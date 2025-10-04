"use client";
import React, { useState, useEffect } from "react";
import { Formik, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Steps } from "antd";
import ImageSelector from "../ui/ImageSelector";
import { FundingType, ProductOrService, CampaignInfoUpdate } from "../../types";
import { toast } from "react-toastify";
import { useAccount } from "wagmi";
import { TiAttachment } from "react-icons/ti";
import Image from "next/image";
import { fundingTypesDisplayNames } from "../../lib/auth/utils/productServiceDisplayNames";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TurnstileWidget from "../ui/TurnstileWidget";
import { inputClass, textareaClass, checkClass } from "../../utils/formClasses";

export interface InitialCampaignValue {
  title: string;
  email: string;
  phoneNumber: string;
  description: string;
  logo: File | string;
  deadline: string;
  location: string;
  one_liner: string;
  fund_amount: number;
  wallet_address: string;
  funding_type: FundingType;
  funds_management: string;
  social_links: {
    telegram: string;
    discord: string;
    website: string;
    linkedIn: string;
  };
}

const FILE_SIZE_LIMIT = 1024 * 1024 * 5; // 5MB in bytes
const fileSizeValidator = Yup.mixed().test(
  "fileSize",
  "File size must be less than 5MB",
  (value: unknown) => {
    if (value instanceof File) {
      return value.size <= FILE_SIZE_LIMIT;
    }
    if (typeof value === "string") {
      return true; // Allow existing logo URLs
    }
    return false;
  }
);
const BASE_URL = `${process.env.R2_BUCKET_URL}/campaign_logos/`;

// Extended validation schema that includes turnstile verification
const validationCombinedSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  one_liner: Yup.string().required("One Liner is required"),
  logo: Yup.mixed().test("logoRequired", "Logo is required", (value) => {
    return (
      value instanceof File ||
      (typeof value === "string" && value.trim() !== "")
    );
  }),
  description: Yup.string().required("Description is required"),
  location: Yup.string().required("Location is required"),
  email: Yup.string().required("Email is required"),
  phoneNumber: Yup.string().required("Phone Number is required"),
  fund_amount: Yup.number()
    .typeError("Fund amount must be a number")
    .required("Fund amount is required")
    .min(0.0000001, "Fund amount must be greater than 0"),
  wallet_address: Yup.string().required("Wallet address is required"),
  funding_type: Yup.string()
    .oneOf(Object.values(FundingType))
    .required("Please select a funding type"),
  funds_management: Yup.string()
    .max(1000, "Funds management description must be 1000 characters or less")
    .required("Funds management description is required"),
  turnstileToken: Yup.string().required(
    "Please complete the security verification"
  ),
});

const defaultValues = {
  title: "",
  email: "",
  phoneNumber: "",
  description: "",
  logo: "",
  deadline: "",
  location: "",
  one_liner: "",
  telegram: "",
  discord: "",
  website: "",
  linkedIn: "",
  wallet_address: "",
  fund_amount: 0,
  funding_type: FundingType.Limitless,
  funds_management: "",
  turnstileToken: "",
};

interface Props {
  onSubmit(values: CampaignInfoUpdate): void;
  onImageRemove?(source: string): void;
  initialValuesProp: InitialCampaignValue;
}

export default function UpdateCampaignForm(props: Props) {
  const { onSubmit, onImageRemove, initialValuesProp } = props;
  console.log(initialValuesProp.funds_management, "funds_management");
  // Get Turnstile site key from environment variables
  const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY EARLY RETURNS
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoSource, setLogoSource] = useState<string[]>();
  const [selectedFundingType, setSelectedFundingType] = useState<FundingType>(
    FundingType.Limitless
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isFormReady, setIsFormReady] = useState(false);

  // Turnstile related state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [isVerifyingTurnstile, setIsVerifyingTurnstile] = useState(false);

  const { address } = useAccount();

  // Process initial values immediately
  const processedInitialValues = React.useMemo(() => {
    if (!initialValuesProp) return defaultValues;

    return {
      title: initialValuesProp.title || "",
      email: initialValuesProp.email || "",
      phoneNumber: initialValuesProp.phoneNumber || "",
      description: initialValuesProp.description || "",
      logo: initialValuesProp.logo
        ? initialValuesProp.logo instanceof File
          ? URL.createObjectURL(initialValuesProp.logo)
          : initialValuesProp.logo.startsWith("http") ||
            initialValuesProp.logo.startsWith("/")
          ? initialValuesProp.logo
          : `${BASE_URL}${initialValuesProp.logo}`
        : "",
      deadline: (() => {
        try {
          if (!initialValuesProp.deadline) return "";

          // Check if it's already a date string (YYYY-MM-DD format)
          if (
            typeof initialValuesProp.deadline === "string" &&
            (initialValuesProp.deadline as string).includes("-")
          ) {
            // It's already a date string, validate it
            const date = new Date(initialValuesProp.deadline);
            if (isNaN(date.getTime())) return "";
            return initialValuesProp.deadline;
          }

          // Otherwise, treat it as a Unix timestamp in seconds
          const deadlineInSeconds = Number(initialValuesProp.deadline);
          if (isNaN(deadlineInSeconds) || deadlineInSeconds <= 0) return "";
          const deadlineInMilliseconds = deadlineInSeconds * 1000;
          const date = new Date(deadlineInMilliseconds);
          if (isNaN(date.getTime())) return "";
          return date.toISOString().split("T")[0];
        } catch (error) {
          console.error("Error converting deadline:", error);
          return "";
        }
      })(),
      location: initialValuesProp.location || "",
      one_liner: initialValuesProp.one_liner || "",
      telegram: initialValuesProp.social_links?.telegram || "",
      discord: initialValuesProp.social_links?.discord || "",
      website: initialValuesProp.social_links?.website || "",
      linkedIn: initialValuesProp.social_links?.linkedIn || "",
      funding_type: initialValuesProp.funding_type || FundingType.Limitless,
      fund_amount: initialValuesProp.fund_amount || 0,
      wallet_address: initialValuesProp.wallet_address || "",
      funds_management: initialValuesProp.funds_management || "",
      turnstileToken: "", // Always initialize as empty
    };
  }, [initialValuesProp]);

  useEffect(() => {
    if (processedInitialValues.logo) {
      setLogoSource([processedInitialValues.logo]);
    }
    setTimeout(() => {
      setIsFormReady(true);
    }, 100);
  }, [processedInitialValues]);

  useEffect(() => {
    if (logoSource && logoSource.length > 0 && !logoPreview) {
      setLogoPreview(logoSource[0]);
    }
  }, [logoSource, logoPreview]);

  // NOW AFTER ALL HOOKS, CHECK FOR EARLY RETURN CONDITIONS
  if (!TURNSTILE_SITE_KEY) {
    console.error(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY environment variable is not set"
    );
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Configuration Error
            </h2>
            <p className="text-red-700">
              Turnstile is not properly configured. Please contact the
              administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  console.log("initialValuesProp received:", initialValuesProp);
  console.log("Processed initial values:", processedInitialValues);

  const onLogoChange = (file: File) => {
    setLogo(file);
    setLogoSource([URL.createObjectURL(file)]);
  };

  // Turnstile token received - mark as verified for frontend UX
  // Note: Actual validation happens server-side to prevent double validation
  const handleTurnstileSuccess = (token: string): void => {
    setTurnstileToken(token);
    setIsTurnstileVerified(true);
    setTurnstileError(null);
    setIsVerifyingTurnstile(false);
  };

  // Simplified function - no frontend validation to prevent double validation
  const verifyTurnstileToken = async (token: string): Promise<boolean> => {
    // Just store the token and mark as verified for UI purposes
    // Actual validation happens server-side during form submission
    setTurnstileToken(token);
    setIsTurnstileVerified(true);
    setTurnstileError(null);
    setIsVerifyingTurnstile(false);

    return true; // Always return true since server-side will validate
  };

  // Handle Turnstile widget callbacks
  const handleTurnstileVerify = async (
    token: string,
    setFieldValue: (field: string, value: any) => void
  ) => {
    console.log("Turnstile token received:", token);
    setTurnstileToken(token);
    setIsTurnstileVerified(true);
    setTurnstileError(null);
    setIsVerifyingTurnstile(false);

    // Set the token in the Formik form field
    setFieldValue("turnstileToken", token);
  };

  const handleTurnstileError = (
    setFieldValue: (field: string, value: any) => void
  ) => {
    console.log("Turnstile error occurred");
    setTurnstileToken(null);
    setIsTurnstileVerified(false);
    setTurnstileError("Security verification failed. Please try again.");

    // Clear the token from the Formik form field
    setFieldValue("turnstileToken", "");
  };

  const handleTurnstileExpire = (
    setFieldValue: (field: string, value: any) => void
  ) => {
    console.log("Turnstile token expired");
    setTurnstileToken(null);
    setIsTurnstileVerified(false);
    setTurnstileError("Security verification expired. Please verify again.");

    // Clear the token from the Formik form field
    setFieldValue("turnstileToken", "");
  };

  const handleSubmit = async (values: typeof defaultValues) => {
    console.log("valuesClient", values);
    setIsPending(true);
    setSubmitError(null);

    try {
      // Check if turnstile token is present in form values
      if (!values.turnstileToken) {
        throw new Error("Please complete the security verification");
      }

      const projectData: CampaignInfoUpdate = {
        title: values.title,
        email: values.email,
        phoneNumber: values.phoneNumber,
        description: values.description,
        logo: logo || values.logo,
        deadline: new Date(values.deadline).getTime(),
        location: values.location,
        one_liner: values.one_liner,
        social_links: {
          discord: values.discord || "",
          telegram: values.telegram || "",
          website: values.website || "",
          linkedIn: values.linkedIn || "",
        },
        fund_amount: Number(values.fund_amount),
        wallet_address: values.wallet_address,
        funding_type: values.funding_type as FundingType,
        funds_management: values.funds_management,
        turnstileToken: values.turnstileToken, // Use form field value
      };

      await onSubmit(projectData);
      toast.success("Campaign updated successfully!");
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitError(
        "An error occurred while updating the campaign. Please try again."
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Formik
      key={JSON.stringify(processedInitialValues)} // Force reinitialization when processedInitialValues changes
      initialValues={processedInitialValues}
      validationSchema={validationCombinedSchema}
      enableReinitialize={true}
      validateOnMount={true}
      onSubmit={handleSubmit}
    >
      {({ validateForm, setFieldValue, submitForm, values }) => {
        console.log("Formik values:", values);
        return (
          <form
            onSubmit={(e) => e.preventDefault()}
            className="p-6 max-w-2xl mx-auto"
          >
            <h1 className="text-3xl text-center mb-4">Update Your Campaign</h1>

            <div>
              <h2 className="text-2xl mb-2">Campaign Info</h2>
              <p className="text-md mb-8 font-thin">
                Enter your campaign`s details. Only the sections marked as
                optional can be changed after deployment; all other information
                will be fixed once submitted.
              </p>
              <h3 className="text-xl mb-2">Campaign Title</h3>
              <Field
                name="title"
                type="text"
                placeholder="Title"
                className={inputClass + " mb-4"}
                value={values.title}
              />
              <ErrorMessage
                name="title"
                component="div"
                className="text-redColor/80 mb-2"
              />

              <h3 className="text-xl mb-2">Campaign One Liner</h3>
              <Field
                name="one_liner"
                placeholder="One Liner"
                className={inputClass + " mb-4"}
                value={values.one_liner}
              />
              <ErrorMessage
                name="one_liner"
                component="div"
                className="text-redColor/80 mb-2"
              />

              <h3 className="text-xl mb-2">Logo</h3>
              <ImageSelector
                id="thumb"
                images={
                  logoPreview
                    ? [logoPreview]
                    : logoSource && logoSource.length > 0
                    ? logoSource
                    : []
                }
                onChange={({ target }) => {
                  const file = target.files ? target.files[0] : null;
                  setFieldValue("logo", file);
                  setLogo(file);
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const dataUrl = e.target?.result as string;
                      setLogoPreview(dataUrl);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <ErrorMessage
                name="logo"
                component="div"
                className="text-redColor/80 mb-2"
              />
            </div>
            <div className="mt-4">
              <h2 className="text-2xl mb-2">Financial</h2>
              <h3 className="text-xl mb-2">Wallet Address for Funds</h3>

              <div className="flex gap-2 relative">
                <Field
                  name="wallet_address"
                  type="text"
                  placeholder="Wallet Address to receive funds"
                  className={inputClass + " mb-4"}
                />
                <button
                  type="button"
                  onClick={() => setFieldValue("wallet_address", address)}
                  className="group relative px-2 py-2 bg-blueColor text-white rounded hover:bg-blueColor/80 h-[42px] flex items-center justify-center"
                >
                  <TiAttachment
                    className="w-8 h-8 "
                    style={{ fill: "white" }}
                  />
                  <span className="invisible group-hover:visible absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm py-1 px-2 rounded whitespace-nowrap">
                    Use Connected Wallet
                  </span>
                </button>
              </div>
              <ErrorMessage
                name="wallet_address"
                component="div"
                className="text-redColor/80 mb-2"
              />
              <h3 className="text-xl mb-2">Fund Amount</h3>
              <Field
                name="fund_amount"
                placeholder="Fund Amount"
                className={inputClass + " mb-4"}
                value={values.fund_amount}
              />
              <ErrorMessage
                name="fund_amount"
                component="div"
                className="text-redColor/80 mb-2"
              />

              <h3 className="text-xl mb-2">Funds Management</h3>
              <Field
                as="textarea"
                name="funds_management"
                placeholder="Describe how you will manage and use the funds..."
                className={textareaClass + " h-32 mb-4"}
                value={values.funds_management}
              />
              <ErrorMessage
                name="funds_management"
                component="div"
                className="text-redColor/80 mb-2"
              />

              <h3 className="text-xl mb-2">Funding Type</h3>
              <Field
                as="select"
                name="funding_type"
                className={inputClass + " mb-4"}
                value={values.funding_type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setFieldValue("funding_type", e.target.value);
                  setSelectedFundingType(e.target.value as FundingType);
                }}
              >
                {Object.entries(fundingTypesDisplayNames).map(
                  ([enumValue, displayName]) => (
                    <option key={enumValue} value={enumValue}>
                      {displayName}
                    </option>
                  )
                )}
              </Field>

              <ErrorMessage
                name="funding_type"
                component="div"
                className="text-redColor/80 mb-2"
              />
            </div>
            <div>
              <h2 className="text-2xl mb-2">Details</h2>
              <p className="text-md mb-8 font-thin">
                Provide the essential details about your campaign including
                campaign description, location, deadline, and contact
                information. These details help potential supporters understand
                your campaign and how to reach you.
              </p>
              <div className="mb-2">
                <h3 className="text-xl mb-2">Campaigns Description</h3>

                <Field
                  as="textarea"
                  name="description"
                  placeholder="Write your description using Markdown..."
                  className={textareaClass + " h-32 mb-4"}
                />

                <ErrorMessage
                  name="description"
                  component="div"
                  className="text-red-500 mb-2"
                />

                <div className="border border-gray-300 p-4 rounded bg-gray-50 dark:bg-dark-surfaceHover dark:text-dark-text">
                  <h4 className="font-semibold mb-2">Preview:</h4>
                  <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {values.description}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              <h3 className="text-xl mb-2">Campaign Location</h3>
              <Field
                name="location"
                placeholder="Location"
                className={inputClass + " mb-4"}
                value={values.location}
              />
              <ErrorMessage
                name="location"
                component="div"
                className="text-redColor/80 mb-2"
              />

              <h3 className="text-xl mb-2">Email</h3>
              <Field
                name="email"
                type="email"
                placeholder="Email"
                className={inputClass + " mb-4"}
                value={values.email}
              />
              <ErrorMessage
                name="email"
                component="div"
                className="text-redColor/80 mb-2"
              />

              <h3 className="text-xl mb-2">Phone Number</h3>
              <Field
                name="phoneNumber"
                type="text"
                placeholder="Phone Number"
                className={inputClass + " mb-4"}
                value={values.phoneNumber}
              />
              <ErrorMessage
                name="phoneNumber"
                component="div"
                className="text-redColor/80 mb-2"
              />

              <h3 className="text-xl mb-2">Deadline</h3>
              <Field
                name="deadline"
                type="date"
                className={inputClass + " mb-4"}
                value={values.deadline}
              />
              <ErrorMessage
                name="deadline"
                component="div"
                className="text-redColor/80 mb-2"
              />
            </div>

            <div>
              <h2 className="text-2xl mb-2">Social Links</h2>
              <h3 className="text-xl mb-2">Telegram</h3>
              <Field
                name="telegram"
                placeholder="Telegram"
                className={inputClass + " mb-4"}
                value={values.telegram}
              />
              <ErrorMessage
                name="telegram"
                component="div"
                className="text-redColor/80 mb-2"
              />

              <h3 className="text-xl mb-2">Discord</h3>
              <Field
                name="discord"
                placeholder="Discord"
                className={inputClass + " mb-4"}
                value={values.discord}
              />
              <ErrorMessage
                name="discord"
                component="div"
                className="text-redColor/80 mb-2"
              />

              <h3 className="text-xl mb-2">Website</h3>
              <Field
                name="website"
                placeholder="Website"
                className={inputClass + " mb-8"}
                value={values.website}
              />
              <ErrorMessage
                name="website"
                component="div"
                className="text-redColor/80 mb-2"
              />

              <h3 className="text-xl mb-2">LinkedIn</h3>
              <Field
                name="linkedIn"
                placeholder="LinkedIn"
                className={inputClass + " mb-4"}
                value={values.linkedIn}
              />
              <ErrorMessage
                name="linkedIn"
                component="div"
                className="text-redColor/80 mb-2"
              />
            </div>

            {/* Security Verification Section */}
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-dark-surface">
              <h3 className="text-lg font-semibold mb-3">
                Security Verification
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please complete the security verification below to proceed with
                your campaign update.
              </p>

              <TurnstileWidget
                sitekey={TURNSTILE_SITE_KEY}
                onVerify={(token) =>
                  handleTurnstileVerify(token, setFieldValue)
                }
                onError={() => handleTurnstileError(setFieldValue)}
                onExpire={() => handleTurnstileExpire(setFieldValue)}
                theme="light"
                size="normal"
                className="mb-2"
              />

              {isVerifyingTurnstile && (
                <div className="mt-2 text-sm text-blue-600">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2"></div>
                    Verifying security token...
                  </div>
                </div>
              )}

              {turnstileError && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                  {turnstileError}
                </div>
              )}

              <ErrorMessage
                name="turnstileToken"
                component="div"
                className="text-redColor/80 mt-2"
              />
            </div>

            <button
              type="submit"
              className="block w-full bg-blueColor text-white p-2 rounded mt-4"
              onClick={submitForm}
              disabled={isPending || !isTurnstileVerified}
            >
              {isPending ? "Submitting..." : "Submit"}
            </button>
            {submitError && (
              <div className="text-redColor/80 mt-4">{submitError}</div>
            )}
          </form>
        );
      }}
    </Formik>
  );
}
