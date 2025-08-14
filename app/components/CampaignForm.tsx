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

const steps = [
  { title: "Project Info" },
  { title: "Description" },
  { title: "Financial Supply" },
  { title: "Funding Type" },
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
  const [isPending, setIsPending] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [markdownPreview, setMarkdownPreview] = useState<string>("");
  const [selectedFundingType, setSelectedFundingType] = useState<FundingType>(
    FundingType.Limitless
  );
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  // Turnstile related state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [isVerifyingTurnstile, setIsVerifyingTurnstile] = useState(false);

  const formikRef = useRef<FormikProps<any>>(null);
  const { address } = useAccount();

  // Get Turnstile site key from environment variables
  const TURNSTILE_SITE_KEY =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"; // Fallback to test key

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

  // Initialize campaign draft functionality
  const {
    formData,
    hasDraft,
    isLoading,
    showRestoreModal,
    setShowRestoreModal,
    loadDraft,
    updateFormData,
    deleteDraft,
    saveError,
    isSaving: isDraftSaving,
  } = useCampaignDraft(campaignFormInitialValues);

  // Track whether we should start saving drafts
  const [enableDraftSaving, setEnableDraftSaving] = useState(false);
  const [currentFormValues, setCurrentFormValues] = useState("");

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

  const prevValuesRef = useRef<string | null>(null);

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

  // Turnstile verification function
  const verifyTurnstileToken = async (token: string): Promise<boolean> => {
    setIsVerifyingTurnstile(true);
    setTurnstileError(null);

    try {
      const response = await fetch("/api/verify-turnstile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (result.success) {
        setIsTurnstileVerified(true);
        setTurnstileError(null);
        return true;
      } else {
        setIsTurnstileVerified(false);
        setTurnstileError(result.error || "Verification failed");
        return false;
      }
    } catch (error) {
      console.error("Turnstile verification error:", error);
      setIsTurnstileVerified(false);
      setTurnstileError("Network error during verification");
      return false;
    } finally {
      setIsVerifyingTurnstile(false);
    }
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
        turnstileToken: _,
        ...rest
      } = values;
      const campaignData: NewCampaignInfo = {
        ...rest,
        logo: logo!,
        deadline: Date.parse(values.deadline),
        fundAmount: Number(values.fundAmount),
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

  // Update markdown preview when description changes
  useEffect(() => {
    if (formikRef.current?.values?.description) {
      setMarkdownPreview(formikRef.current.values.description);
    } else {
      setMarkdownPreview("");
    }
  }, [formikRef.current?.values?.description]);

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
                    <div className="inline-flex items-center text-blue-600 text-sm">
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-600 mr-2"></div>
                      Saving draft...
                    </div>
                  )}
                  {saveError && (
                    <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2 mt-2">
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
                    <p className="text-md mb-8 font-thin">
                      Enter your campaign`s details. Only the sections marked as
                      optional can be changed after deployment; all other
                      information will be fixed once submitted.
                    </p>
                    <h3 className="text-xl mb-2">Campaigns Title</h3>
                    <Field
                      name="title"
                      type="text"
                      placeholder="Title"
                      className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blueColor"
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
                      className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blueColor"
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
                        className="block w-full p-2 border border-gray-300 rounded h-32 mb-4 focus:outline-none focus:border-blue-500"
                      />

                      <ErrorMessage
                        name="description"
                        component="div"
                        className="text-redColor/80 mb-2"
                      />

                      <div className="border border-gray-300 p-4 rounded bg-gray-50">
                        <h4 className="font-semibold mb-2">Preview:</h4>
                        <div className="prose max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {values.description}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-xl mb-2">Campaigns Location</h3>
                    <Field
                      name="location"
                      placeholder="Location"
                      className="block w-full p-2 border border-gray-300 rounded mb-4  focus:outline-none focus:border-blueColor"
                    />
                    <ErrorMessage
                      name="location"
                      component="div"
                      className="text-redColor/80 mb-2"
                    />
                    <h3 className="text-xl mb-2">Campaigns Deadline</h3>
                    <Field
                      name="deadline"
                      type="date"
                      placeholder="Deadline"
                      className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blueColor"
                    />
                    <ErrorMessage
                      name="deadline"
                      component="div"
                      className="text-redColor/80 mb-2"
                    />
                    <h3 className="text-xl mb-2">Contact Information</h3>
                    <Field
                      name="email"
                      type="email"
                      placeholder="Email Address"
                      className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blueColor"
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-redColor/80 mb-2"
                    />
                    <Field
                      name="phoneNumber"
                      placeholder="Phone Number"
                      className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blueColor"
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
                      className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blueColor"
                    />
                    <Field
                      name="discord"
                      placeholder="Discord URL"
                      className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blueColor"
                    />
                    <Field
                      name="telegram"
                      placeholder="Telegram URL"
                      className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blueColor"
                    />
                    <Field
                      name="linkedIn"
                      placeholder="LinkedIn URL"
                      className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blueColor"
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
                      className="block w-full p-2 border border-gray-300 focus:border-blueColor rounded mb-4 focus:outline-none"
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
                        className="block w-full p-2 border border-gray-300 focus:border-blueColor rounded mb-4 focus:outline-none"
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
                  </div>
                )}

                {currentStep === 3 && (
                  <div>
                    <h2 className="text-2xl mb-2">Choose Your Funding Type</h2>
                    <p className="text-md mb-8 font-thin">
                      Select the funding model that best fits your campaign`s
                      needs.
                    </p>

                    <FundingTypeSelector
                      setFieldValue={setFieldValue}
                      value={values.funding_type}
                    />

                    <ErrorMessage
                      name="funding_type"
                      component="div"
                      className="text-redColor/80 mt-4"
                    />
                  </div>
                )}

                {currentStep === 4 && (
                  <div>
                    <h2 className="text-2xl mb-2">Review</h2>
                    <p className="text-md mb-8 font-thin">
                      For this final step, please review all information
                      carefully. Once submitted, the details provided here will
                      be fixed and cannot be changed. Ensure accuracy before
                      completing your submission.
                    </p>

                    {/* Security Verification Section */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h3 className="text-lg font-semibold mb-3">
                        Security Verification
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
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
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-redColor/80">
                              Error Creating Campaign
                            </h3>
                            <div className="mt-2 text-sm text-redColor/80">
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
                          className="mt-1 mr-3 h-4 w-4 text-blueColor focus:ring-blueColor border-gray-300 rounded"
                        />
                        <label
                          htmlFor="acceptTerms"
                          className="text-sm text-gray-700"
                        >
                          I have read and agree to the{" "}
                          <a
                            href="/terms-and-conditions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blueColor hover:underline"
                          >
                            Terms and Conditions
                          </a>{" "}
                          and{" "}
                          <a
                            href="/privacy-policy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blueColor hover:underline"
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
                        ? "bg-gray-300"
                        : "bg-blueColor text-white"
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
                              toast.error(`${field}: ${error}`, {
                                autoClose: 3000,
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
                              toast.error(`${field}: ${error}`, {
                                autoClose: 3000,
                              });
                            });
                          }
                        });
                      }}
                      className="px-4 py-2 bg-blueColor text-white rounded"
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
                    } text-white transition duration-200`}
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

                        toast.success("Draft saved successfully!");

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
