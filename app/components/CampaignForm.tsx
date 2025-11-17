"use client";
import React, { useState, useEffect, useRef } from "react";
import { Formik, Field, ErrorMessage, FormikProps } from "formik";
import * as Yup from "yup";
import { Steps } from "antd";
import ImageSelector from "./ui/ImageSelector";
import { NewCampaignInfo, FundingType } from "@/app/types";
import { useCampaignDraft } from "../hooks/useCampaignDraft";
import {
  campaignFormValidationSchemas,
  campaignFormInitialValues,
  fileSizeValidator,
} from "@/app/lib/validation/campaignDraftValidation";
import RestoreDraftModal from "./RestoreDraftModal";
import { toast } from "react-toastify";
import { useAccount } from "wagmi";
import { TiAttachment } from "react-icons/ti";
import FundingTypeSelector from "./ui/FundingTypeSelector";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { debounce } from "lodash";
import CampaignFormDescription from "./ui/CampaignFormDescription";
import TurnstileWidget from "./ui/TurnstileWidget";
import LocationAutocomplete from "./ui/LocationAutocomplete";
import { inputClass, textareaClass, checkClass } from "../utils/formClasses";
const steps = [
  { title: "Project Info" },
  { title: "Description" },
  { title: "Financial Supply" },
  { title: "Funding Type & Deadline" },
  { title: "Review" },
];

interface Props {
  onSubmit(values: NewCampaignInfo): Promise<any>;
  onImageRemove?(source: string): void;
}

// Extended validation schema for the final step that includes turnstile verification
const finalStepValidationSchema = campaignFormValidationSchemas[4].shape({
  turnstileToken: Yup.string().required(
    "Please complete the security verification"
  ),
});

export default function CampaignForm(props: Props) {
  const { onSubmit, onImageRemove } = props;

  // All React Hooks must be called at the top level
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [markdownPreview, setMarkdownPreview] = useState("");
  const [selectedFundingType, setSelectedFundingType] = useState<FundingType>(
    FundingType.Limitless
  );
  const [isSaving, setIsSaving] = useState(false);

  // Turnstile related state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [isVerifyingTurnstile, setIsVerifyingTurnstile] = useState(false);

  const { address } = useAccount();

  // All hooks must be called before any early returns
  const formikRef = useRef<FormikProps<any>>(null);
  const prevValuesRef = useRef<string | null>(null);

  // Track whether we should start saving drafts
  const [enableDraftSaving, setEnableDraftSaving] = useState(false);
  const [currentFormValues, setCurrentFormValues] = useState("");

  // Campaign draft management
  const {
    hasDraft,
    isLoading,
    showRestoreModal,
    setShowRestoreModal,
    loadDraft,
    updateFormData,
    deleteDraft,
    saveError,
    isSaving: isDraftSaving,
    formData,
  } = useCampaignDraft(campaignFormInitialValues);

  // Phase 1: Check if we have a draft and need to show the modal
  useEffect(() => {
    if (hasDraft) {
      console.log(
        "Draft exists, showing restore modal. Draft saving is DISABLED."
      );
    } else {
      console.log("No draft exists, enabling draft saving immediately.");
      setEnableDraftSaving(true);
    }
  }, [hasDraft]);

  // Phase 2: Only set up form value tracking if draft saving is enabled
  useEffect(() => {
    if (!enableDraftSaving) {
      console.log("Draft saving disabled - not tracking form values");
      return;
    }

    console.log("Draft saving ENABLED - starting to track form values");

    const checkFormValues = () => {
      if (formikRef.current?.values) {
        const valuesJson = JSON.stringify(formikRef.current.values);
        setCurrentFormValues(valuesJson);
      }
    };

    checkFormValues();
    const intervalId = setInterval(checkFormValues, 500);
    return () => clearInterval(intervalId);
  }, [enableDraftSaving]);

  // The main effect that saves drafts based on value changes
  useEffect(() => {
    if (!enableDraftSaving) {
      console.log("Draft saving disabled - not saving any changes");
      return;
    }

    if (!currentFormValues) return;

    if (prevValuesRef.current === null) {
      console.log(
        "First run after enabling saving, just storing reference values"
      );
      prevValuesRef.current = currentFormValues;
      return;
    }

    if (!formikRef.current?.isSubmitting) {
      if (prevValuesRef.current !== currentFormValues) {
        console.log("Values changed, saving draft");
        const debouncedSave = debounce(() => {
          const formValues = JSON.parse(currentFormValues);
          const dataToSave = {
            ...formValues,
            logoPreview,
          };
          console.log("Saving data with debounce:", dataToSave);
          updateFormData(dataToSave);
          prevValuesRef.current = currentFormValues;
        }, 1500);

        debouncedSave();
        return () => debouncedSave.cancel();
      }
    }
  }, [currentFormValues, logoPreview, updateFormData, enableDraftSaving]);

  // Update markdown preview when description changes
  useEffect(() => {
    if (formikRef.current?.values?.description) {
      setMarkdownPreview(formikRef.current.values.description);
    } else {
      setMarkdownPreview("");
    }
  }, [formikRef.current?.values?.description]);

  // Get Turnstile site key from environment variables
  const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Early return if Turnstile site key is not configured
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

  //Description Section Related State and Functions
  const toggleDescriptionSection = (sectionNumber: number) => {
    setExpandedSections((prev) =>
      prev.includes(sectionNumber)
        ? prev.filter((num) => num !== sectionNumber)
        : [...prev, sectionNumber]
    );
  };

  const formatText = (text: string) => {
    return text.split("*").map((part, index) =>
      index % 2 === 1 ? (
        <em key={index} className="text-gray-600 font-medium">
          {part}
        </em>
      ) : (
        part
      )
    );
  };

  // Initialize campaign draft functionality - all hooks already declared above

  // Helper function to convert data URL to File object
  const dataURLtoFile = (dataUrl: string, filename: string): File | null => {
    try {
      const arr = dataUrl.split(",");
      if (arr.length < 2) return null;

      const mime = arr[0].match(/:(.*?);/)?.[1];
      if (!mime) return null;

      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      return new File([u8arr], filename, { type: mime });
    } catch (error) {
      console.error("Error converting data URL to File:", error);
      return null;
    }
  };

  // Note: Actual validation happens server-side to prevent double validation
  const handleTurnstileSuccess = (token: string): void => {
    setTurnstileToken(token);
    setIsTurnstileVerified(true);
    setTurnstileError(null);
    setIsVerifyingTurnstile(false);

    // Set the token in the form
    if (formikRef.current) {
      formikRef.current.setFieldValue("turnstileToken", token);
    }
  };

  // Simplified function - no frontend validation to prevent double validation
  const verifyTurnstileToken = async (token: string): Promise<boolean> => {
    // Just store the token and mark as verified for UI purposes
    // Actual validation happens server-side during form submission
    setTurnstileToken(token);
    setIsTurnstileVerified(true);
    setTurnstileError(null);
    setIsVerifyingTurnstile(false);

    // Set the token in the form
    if (formikRef.current) {
      formikRef.current.setFieldValue("turnstileToken", token);
    }

    return true; // Always return true since server-side will validate
  };

  // Handle Turnstile widget callbacks
  const handleTurnstileVerify = async (token: string) => {
    console.log("Turnstile token received:", token);
    setTurnstileToken(token);

    // Set the token in Formik form
    if (formikRef.current) {
      formikRef.current.setFieldValue("turnstileToken", token);
    }

    // Verify the token with your backend
    const isValid = await verifyTurnstileToken(token);
    if (!isValid) {
      // Reset the token if verification failed
      setTurnstileToken(null);
      if (formikRef.current) {
        formikRef.current.setFieldValue("turnstileToken", "");
      }
    }
  };

  const handleTurnstileError = () => {
    console.log("Turnstile error occurred");
    setTurnstileToken(null);
    setIsTurnstileVerified(false);
    setTurnstileError("Security verification failed. Please try again.");

    if (formikRef.current) {
      formikRef.current.setFieldValue("turnstileToken", "");
    }
  };

  const handleTurnstileExpire = () => {
    console.log("Turnstile token expired");
    setTurnstileToken(null);
    setIsTurnstileVerified(false);
    setTurnstileError("Security verification expired. Please verify again.");

    if (formikRef.current) {
      formikRef.current.setFieldValue("turnstileToken", "");
    }
  };

  // Handle restoring draft
  const handleRestoreDraft = async () => {
    const draftData = await loadDraft();
    if (draftData && formikRef.current) {
      if (draftData.logoPreview) {
        setLogoPreview(draftData.logoPreview);

        const reconstructedFile = dataURLtoFile(
          draftData.logoPreview,
          "restored-logo.png"
        );
        if (reconstructedFile) {
          console.log("Successfully reconstructed File from data URL");
          setLogo(reconstructedFile);
          draftData.logo = reconstructedFile;
        } else {
          console.error("Failed to reconstruct File from data URL");
        }
      }

      formikRef.current.setValues({
        ...campaignFormInitialValues,
        ...draftData,
        turnstileToken: "", // Always reset turnstile token
      });

      toast.success("Draft restored successfully!");
    }
    setShowRestoreModal(false);
    console.log("User chose to restore draft - NOW enabling draft saving");
    setEnableDraftSaving(true);
  };

  // Handle discarding draft
  const handleDiscardDraft = async () => {
    await deleteDraft();
    setShowRestoreModal(false);
    toast.info("Starting with a fresh form.");
    console.log(
      "User chose to discard draft - NOW enabling draft saving with empty form"
    );
    setEnableDraftSaving(true);
  };

  const handleSubmit = async (values: typeof campaignFormInitialValues) => {
    setIsPending(true);
    setSubmitError(null);

    try {
      // Final turnstile verification before submission
      if (!isTurnstileVerified || !turnstileToken) {
        throw new Error("Please complete the security verification");
      }

      // Convert form values to expected campaign data format
      const {
        discord,
        telegram,
        website,
        linkedIn,
        turnstileToken: formTurnstileToken,
        funds_management,
        ...rest
      } = values;

      // Convert funds_management string to array format
      // For new campaigns, create array with single entry
      const fundsManagementArray =
        typeof funds_management === "string" && funds_management.trim()
          ? [
              {
                text: funds_management.trim(),
                timestamp: Date.now(),
              },
            ]
          : Array.isArray(funds_management)
          ? funds_management
          : [];

      // For Limitless funding type, use a generic far-future deadline if not provided
      let deadlineValue: number;
      if (rest.funding_type === FundingType.Limitless && !values.deadline) {
        // Set deadline to 100 years from now (generic value for Limitless)
        const farFutureDate = new Date();
        farFutureDate.setFullYear(farFutureDate.getFullYear() + 100);
        deadlineValue = farFutureDate.getTime();
      } else {
        deadlineValue = Date.parse(values.deadline);
      }

      const campaignData: NewCampaignInfo = {
        ...rest,
        logo: logo!,
        deadline: deadlineValue,
        fundAmount: Number(values.fundAmount),
        funds_management: fundsManagementArray,
        turnstileToken: turnstileToken, // Use state variable for server-side validation
        social_links: {
          discord: discord || "",
          telegram: telegram || "",
          website: website || "",
          linkedIn: linkedIn || "",
        },
      };

      const response = await onSubmit(campaignData);

      // Delete draft after successful submission
      await deleteDraft();

      return response;
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "An unknown error occurred while creating the campaign"
      );
      console.error("Campaign submission error:", error);
    } finally {
      setIsPending(false);
    }
  };

  // Handle file selection for logo upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const FILE_SIZE_LIMIT = 1024 * 1024 * 5; // 5MB in bytes
  const fileSizeValidator = Yup.mixed().test(
    "fileSize",
    "File size must be less than 5MB",
    (value: unknown) => {
      if (value instanceof File) {
        return value.size <= FILE_SIZE_LIMIT;
      }
      return true;
    }
  );

  // Update markdown preview when description changes - already declared above

  return (
    <>
      {showRestoreModal && (
        <RestoreDraftModal
          isOpen={showRestoreModal}
          onClose={() => setShowRestoreModal(false)}
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blueColor"></div>
        </div>
      ) : (
        <Formik
          innerRef={formikRef}
          initialValues={{
            ...(hasDraft && formData ? formData : campaignFormInitialValues),
            turnstileToken: "", // Always initialize as empty
          }}
          validationSchema={
            currentStep === 4
              ? finalStepValidationSchema
              : campaignFormValidationSchemas[currentStep]
          }
          enableReinitialize={true}
          validateOnMount={true}
          onSubmit={handleSubmit}
        >
          {({ validateForm, setFieldValue, submitForm, values, errors }) => {
            return (
              <form onSubmit={submitForm} className="p-6 max-w-2xl mx-auto">
                <h1 className="text-3xl text-center mb-4">
                  Create Your Campaign
                </h1>

                {/* Draft saving status indicator */}
                <div className="mb-4 text-center">
                  {isDraftSaving && (
                    <div className="inline-flex items-center text-blueColor dark:text-dark-text text-sm">
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blueColor dark:border-dark-textMuted mr-2"></div>
                      Saving draft...
                    </div>
                  )}
                  {saveError && (
                    <div className="text-redColor text-sm bg-red-50 border border-red-200 rounded-md p-2 mt-2">
                      <strong>Draft Save Error:</strong> {saveError}
                    </div>
                  )}
                  {!isDraftSaving && !saveError && formData && (
                    <div className="text-green-600 text-sm">
                      ✓ Draft auto-saved
                    </div>
                  )}
                </div>
                <div className="mb-6">
                  <Steps
                    progressDot
                    current={currentStep}
                    className="dark:text-dark-text"
                    responsive
                    items={steps.map((step, index) => ({
                      title: step.title,
                      description:
                        index < currentStep
                          ? "Completed"
                          : index === currentStep
                          ? "In Progress"
                          : "Pending",
                    }))}
                  />
                </div>

                {currentStep === 0 && (
                  <div>
                    <h2 className="text-2xl mb-2">Campaign Info</h2>
                    <p className="text-md mb-8 font-thin dark:text-dark-text">
                      Enter your campaign`s details. Only the sections marked as
                      optional can be changed after deployment; all other
                      information will be fixed once submitted.
                    </p>
                    <h3 className="text-xl mb-2">Campaigns Title</h3>
                    <Field
                      name="title"
                      type="text"
                      placeholder="Title"
                      className={inputClass + " mb-4"}
                    />
                    <ErrorMessage
                      name="title"
                      component="div"
                      className="text-redColor/80 mb-2"
                    />
                    <h3 className="text-xl mb-2">Campaigns One Liner</h3>
                    <Field
                      name="one_liner"
                      placeholder="One Liner"
                      className={inputClass + " mb-4"}
                    />
                    <ErrorMessage
                      name="one_liner"
                      component="div"
                      className="text-redColor/80 mb-2"
                    />

                    <h3 className="text-xl mb-2">Logo</h3>
                    <ImageSelector
                      id="thumb"
                      images={logoPreview ? [logoPreview] : []}
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
                )}

                {currentStep === 1 && (
                  <div>
                    <h2 className="text-2xl mb-2">Details</h2>
                    <CampaignFormDescription />
                    <div className="mb-2">
                      <h3 className="text-xl mb-2">Campaign Description</h3>

                      <Field
                        as="textarea"
                        name="description"
                        placeholder="Write your description using Markdown..."
                        className={textareaClass + " h-32 mb-4"}
                      />

                      <ErrorMessage
                        name="description"
                        component="div"
                        className="text-redColor/80 mb-2"
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

                    <h3 className="text-xl mb-2">Campaigns Location</h3>
                    <LocationAutocomplete
                      name="location"
                      value={values.location}
                      onChange={(value) => setFieldValue("location", value)}
                      placeholder="Search for a location..."
                      className={inputClass + " mb-4"}
                    />
                    <ErrorMessage
                      name="location"
                      component="div"
                      className="text-redColor/80 mb-2"
                    />
                    <h3 className="text-xl mb-2">Contact Information</h3>
                    <Field
                      name="email"
                      type="email"
                      placeholder="Email Address"
                      className={inputClass + " mb-4"}
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-redColor/80 mb-2"
                    />
                    <Field
                      name="phoneNumber"
                      placeholder="Phone Number"
                      className={inputClass + " mb-4"}
                    />
                    <ErrorMessage
                      name="phoneNumber"
                      component="div"
                      className="text-redColor/80 mb-2"
                    />
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl mr-2">Social Links</h3>
                      <p>(optional)</p>
                    </div>
                    <Field
                      name="website"
                      placeholder="Website URL"
                      className={inputClass + " mb-4"}
                    />
                    <Field
                      name="discord"
                      placeholder="Discord URL"
                      className={inputClass + " mb-4"}
                    />
                    <Field
                      name="telegram"
                      placeholder="Telegram URL"
                      className={inputClass + " mb-4"}
                    />
                    <Field
                      name="linkedIn"
                      placeholder="LinkedIn URL"
                      className={inputClass + " mb-4"}
                    />
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <h3 className="text-xl mb-2">Fund Amount</h3>
                    <Field
                      name="fundAmount"
                      type="text"
                      placeholder="Fund Amount"
                      className={inputClass + " mb-4"}
                      min="0"
                    />
                    <ErrorMessage
                      name="fundAmount"
                      component="div"
                      className="text-redColor/80 mb-2"
                    />

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

                    <h3 className="text-xl mb-2">Funds Management</h3>
                    <Field
                      as="textarea"
                      name="funds_management"
                      placeholder="Describe how you will manage and use the funds..."
                      className={textareaClass + " h-32 mb-4"}
                    />
                    <ErrorMessage
                      name="funds_management"
                      component="div"
                      className="text-redColor/80 mb-2"
                    />
                  </div>
                )}

                {currentStep === 3 && (
                  <div>
                    <h2 className="text-2xl mb-2">Choose Your Funding Type</h2>
                    <p className="text-md mb-8 font-thin dark:text-dark-text">
                      Select the funding model that best fits your campaign`s
                      needs.
                    </p>

                    <FundingTypeSelector
                      setFieldValue={(field, value) => {
                        setFieldValue(field, value);
                        // If Limitless is selected, set a generic far-future deadline
                        if (value === FundingType.Limitless) {
                          // Set deadline to 100 years from now (generic value)
                          const farFutureDate = new Date();
                          farFutureDate.setFullYear(
                            farFutureDate.getFullYear() + 100
                          );
                          setFieldValue(
                            "deadline",
                            farFutureDate.toISOString().split("T")[0]
                          );
                        } else if (
                          values.funding_type === FundingType.Limitless &&
                          value !== FundingType.Limitless
                        ) {
                          // If switching away from Limitless, clear the deadline
                          setFieldValue("deadline", "");
                        }
                      }}
                      value={values.funding_type}
                    />

                    <ErrorMessage
                      name="funding_type"
                      component="div"
                      className="text-redColor/80 mt-4"
                    />

                    <h3 className="text-xl mb-2 mt-6">
                      Campaign Deadline
                      {values.funding_type === FundingType.Limitless && (
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          (Optional for Limitless funding)
                        </span>
                      )}
                    </h3>
                    <Field
                      name="deadline"
                      type="date"
                      placeholder="Deadline"
                      className={inputClass + " mb-4"}
                      disabled={values.funding_type === FundingType.Limitless}
                    />
                    {values.funding_type === FundingType.Limitless && (
                      <p className="text-sm text-gray-500 mb-4">
                        Deadline is not required for Limitless funding. Funds
                        are immediately transferred to your escrow wallet and
                        can be withdrawn at any time.
                      </p>
                    )}
                    <ErrorMessage
                      name="deadline"
                      component="div"
                      className="text-redColor/80 mb-2"
                    />
                  </div>
                )}

                {currentStep === 4 && (
                  <div>
                    <h2 className="text-2xl mb-2">Review</h2>
                    <p className="text-md mb-8 font-thin dark:text-dark-text">
                      For this final step, please review all information
                      carefully. Once submitted, the details provided here will
                      be fixed and cannot be changed. Ensure accuracy before
                      completing your submission.
                    </p>

                    {/* Security Verification Section */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-dark-surface">
                      <h3 className="text-lg font-semibold mb-3">
                        Security Verification
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 dark:text-dark-text">
                        Please complete the security verification below to
                        proceed with your campaign submission.
                      </p>

                      <TurnstileWidget
                        sitekey={TURNSTILE_SITE_KEY}
                        onVerify={handleTurnstileVerify}
                        onError={handleTurnstileError}
                        onExpire={handleTurnstileExpire}
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

                    {submitError && (
                      <div className="mb-6 p-4 bg-red-50 border-l-4 border-redColor rounded-r">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-redColor/80"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3 max-w-[500px]">
                            <h3 className="text-sm font-medium text-redColor/80">
                              Error Creating Campaign
                            </h3>
                            <div className="mt-2 text-sm text-redColor/80 break-words max-w-full">
                              {submitError}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="flex items-start">
                        <Field
                          name="acceptTerms"
                          type="checkbox"
                          className={checkClass + " mt-1 mr-3"}
                        />
                        <label
                          htmlFor="acceptTerms"
                          className="text-sm text-gray-700 dark:text-dark-text"
                        >
                          I have read and agree to the{" "}
                          <a
                            href="/terms-and-conditions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blueColor dark:text-dark-textMuted hover:underline"
                          >
                            Terms and Conditions
                          </a>{" "}
                          and{" "}
                          <a
                            href="/privacy-policy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blueColor dark:text-dark-textMuted hover:underline"
                          >
                            Privacy Policy.
                          </a>
                        </label>
                      </div>
                      <ErrorMessage
                        name="acceptTerms"
                        component="div"
                        className="text-redColor/80 mt-2"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    disabled={currentStep === 0}
                    className={`px-4 py-2 rounded ${
                      currentStep === 0
                        ? "bg-gray-300 dark:bg-dark-surfaceHover "
                        : "bg-blueColor text-white "
                    }`}
                  >
                    Previous
                  </button>

                  {currentStep === steps.length - 1 ? (
                    <button
                      type="button"
                      className="px-4 py-2 bg-blueColor text-white rounded disabled:bg-gray-400"
                      disabled={isPending || !isTurnstileVerified}
                      onClick={() => {
                        validateForm().then((errors) => {
                          console.log("Validating before submit:", errors);
                          if (Object.keys(errors).length === 0) {
                            console.log("Manually submitting form");
                            submitForm();
                          } else {
                            console.log(
                              "Validation errors prevented submission:",
                              errors
                            );
                            Object.entries(errors).forEach(([field, error]) => {
                              const errorMessage =
                                typeof error === "string"
                                  ? error
                                  : String(error);
                              const truncatedMessage =
                                errorMessage.length > 100
                                  ? errorMessage.substring(0, 100) + "..."
                                  : errorMessage;
                              toast.error(`${field}: ${truncatedMessage}`, {
                                autoClose: 5000,
                                style: {
                                  maxWidth: "400px",
                                  wordWrap: "break-word",
                                  whiteSpace: "pre-wrap",
                                },
                              });
                            });
                          }
                        });
                      }}
                    >
                      {isPending ? (
                        <div className="flex items-center text-white">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="white"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Submitting...
                        </div>
                      ) : (
                        "Submit"
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        validateForm().then((errors) => {
                          console.log("Current form values:", values);
                          console.log("Validation Errors:", errors);
                          if (Object.keys(errors).length === 0) {
                            setCurrentStep((prev) => prev + 1);
                          } else {
                            Object.entries(errors).forEach(([field, error]) => {
                              const errorMessage =
                                typeof error === "string"
                                  ? error
                                  : String(error);
                              const truncatedMessage =
                                errorMessage.length > 100
                                  ? errorMessage.substring(0, 100) + "..."
                                  : errorMessage;
                              toast.error(`${field}: ${truncatedMessage}`, {
                                autoClose: 5000,
                                style: {
                                  maxWidth: "400px",
                                  wordWrap: "break-word",
                                  whiteSpace: "pre-wrap",
                                },
                              });
                            });
                          }
                        });
                      }}
                      className="px-4 py-2 bg-blueColor text-white  rounded"
                    >
                      Next
                    </button>
                  )}
                </div>

                <div className="flex items-center mt-4">
                  <button
                    className={`px-4 py-2 rounded ${
                      isSaving
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blueColor hover:bg-blueColor/80"
                    } text-white  transition duration-200`}
                    type="button"
                    disabled={isSaving}
                    onClick={() => {
                      setIsSaving(true);

                      console.log("Manual save triggered");
                      if (formikRef.current?.values) {
                        const data = {
                          ...formikRef.current.values,
                          logoPreview,
                          turnstileToken: "", // Don't save turnstile token in draft
                        };
                        console.log("Saving data:", data);
                        updateFormData(data);

                        setTimeout(() => {
                          setIsSaving(false);
                        }, 3000);
                      } else {
                        setIsSaving(false);
                      }
                    }}
                  >
                    {isSaving ? "Saving..." : "Save form as a draft"}
                  </button>

                  {isSaving && (
                    <span className="ml-3 text-sm text-gray-500">
                      Please wait a moment before saving again...
                    </span>
                  )}
                </div>
              </form>
            );
          }}
        </Formik>
      )}
    </>
  );
}
