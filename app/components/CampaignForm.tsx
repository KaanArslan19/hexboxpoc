"use client";
import React, { useState } from "react";
import { Formik, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Steps } from "antd";
import ImageSelector from "./ui/ImageSelector";
import { NewCampaignInfo, FundingType, ProductOrService } from "../types";

const steps = [
  { title: "Project Info" },
  { title: "Description" },
  { title: "Financial Supply" },
  { title: "Review" },
];

const FILE_SIZE_LIMIT = 1024 * 1024; // 1MB in bytes
const fileSizeValidator = Yup.mixed().test(
  "fileSize",
  "File size must be less than 1MB",
  (value: unknown) => {
    if (value instanceof File) {
      return value.size <= FILE_SIZE_LIMIT;
    }
    return true;
  }
);

const validationSchema = [
  Yup.object({
    title: Yup.string().required("Title is required"),
    one_liner: Yup.string().required("One Liner is required"),
    logo: fileSizeValidator.required("Logo is required"),
  }),
  Yup.object({
    description: Yup.string().required("Description is required"),
    location: Yup.string().required("Location is required"),
    deadline: Yup.date()
      .required("Project Deadline date is required")
      .min(new Date(), "Deadline must be in the future"),
  }),
  Yup.object({
    fundAmount: Yup.number()
      .typeError("Fund amount must be a number")
      .required("Fund amount is required")
      .min(0.0000001, "Fund amount must be greater than 0"),
    funding_type: Yup.string()
      .oneOf(Object.values(FundingType))
      .required("Funding type is required"),
    productOrService: Yup.string()
      .oneOf(Object.values(ProductOrService))
      .required("Product/Service type is required"),
    walletAddress: Yup.string().required("Wallet address is required"),
  }),
];

const initialValues = {
  title: "",
  description: "",
  fundAmount: 0,
  logo: null,
  deadline: "",
  location: "",
  walletAddress: "",
  one_liner: "",
  telegram: "",
  discord: "",
  website: "",
  linkedIn: "",
  funding_type: FundingType.Limitless,
  product_or_service: ProductOrService.ProductOnly,
};

interface Props {
  onSubmit(values: NewCampaignInfo): void;
  onImageRemove?(source: string): void;
}
const fundingTypeDescriptions = {
  [FundingType.Limitless]:
    "No funding cap. Continue receiving funds until the deadline, regardless of the target amount.",
  [FundingType.AllOrNothing]:
    "You'll only receive the funds if the target amount is reached by the deadline. If not met, all funds are returned to backers.",
  [FundingType.Flexible]:
    "Keep all funds raised, even if you don't reach your target amount by the deadline.",
};

const productServiceDescriptions = {
  [ProductOrService.ProductOnly]:
    "Your campaign offers only physical or digital products to backers.",
  [ProductOrService.ServiceOnly]:
    "Your campaign offers only services or experiences to backers.",
  [ProductOrService.ProductAndService]:
    "Your campaign offers both products and services to backers.",
};
export default function CampaignForm(props: Props) {
  const { onSubmit, onImageRemove } = props;
  const [isPending, setIsPending] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [walletInfo, setWalletInfo] = useState<string | null>(null);
  const [selectedFundingType, setSelectedFundingType] = useState<FundingType>(
    FundingType.Limitless
  );
  const [selectedProductService, setSelectedProductService] =
    useState<ProductOrService>(ProductOrService.ProductOnly);

  const handleSubmit = async (values: typeof initialValues) => {
    setIsPending(true);
    setSubmitError(null);

    const projectData: NewCampaignInfo = {
      title: values.title,
      description: values.description,
      fundAmount: Number(values.fundAmount),
      logo: values.logo!,
      deadline: Date.parse(values.deadline),
      location: values.location,
      one_liner: values.one_liner,
      social_links: {
        discord: values.discord,
        telegram: values.telegram,
        website: values.website,
        linkedIn: values.linkedIn,
      },
      walletAddress: values.walletAddress,
      funding_type: values.funding_type as FundingType,
      product_or_service: values.product_or_service as ProductOrService,
    };

    try {
      await onSubmit(projectData);
    } catch (error) {
      setSubmitError("An unknown error occurred");
    } finally {
      setIsPending(false);
    }
    console.log(submitError);
  };
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema[currentStep]}
      onSubmit={handleSubmit}
    >
      {({ validateForm, setFieldValue, submitForm }) => (
        <form
          onSubmit={(e) => e.preventDefault()}
          className="p-6 max-w-2xl mx-auto"
        >
          <h1 className="text-3xl text-center mb-4">Create Your Campaign</h1>
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
              <h2 className="text-2xl mb-2">Project Info</h2>
              <p className="text-md mb-8 font-thin">
                Enter your project`s details. Only the sections marked as
                optional can be changed after deployment; all other information
                will be fixed once submitted.
              </p>
              <h3 className="text-xl mb-2">Projects Title</h3>
              <Field
                name="title"
                type="text"
                placeholder="Title"
                className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blueColor"
              />
              <ErrorMessage
                name="title"
                component="div"
                className="text-redColor mb-2"
              />
              <h3 className="text-xl mb-2">Projects One Liner</h3>
              <Field
                name="one_liner"
                placeholder="One Liner"
                className="block w-full p-2 border border-gray-300 rounded mb-8 focus:outline-none focus:border-blueColor"
              />
              <ErrorMessage
                name="one_liner"
                component="div"
                className="text-redColor mb-2"
              />

              <h3 className="text-xl mb-2">Logo</h3>
              <ImageSelector
                id="thumb"
                images={logo ? [URL.createObjectURL(logo)] : []}
                onChange={({ target }) => {
                  const file = target.files ? target.files[0] : null;
                  setFieldValue("logo", file);
                  setLogo(target.files ? target.files[0] : null);
                }}
              />
              <ErrorMessage
                name="logo"
                component="div"
                className="text-redColor mb-2"
              />
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl mb-2">Details</h2>
              <p className="text-md mb-8 font-thin">
                Enter the desired fund amount for your campaign. This is the
                total funding goal you`d like to reach to support your project`s
                objectives. Ensure the amount accurately reflects the resources
                needed to bring your project to life.
              </p>
              <h3 className="text-xl mb-2">Projects Description</h3>
              <Field
                as="textarea"
                name="description"
                placeholder="Description"
                className="block w-full p-2 border border-gray-300 rounded h-32 mb-8 focus:outline-none focus:border-blueColor"
              />
              <ErrorMessage
                name="description"
                component="div"
                className="text-redColor mb-2"
              />
              <h3 className="text-xl mb-2">Projects Location</h3>
              <Field
                name="location"
                placeholder="Location"
                className="block w-full p-2 border border-gray-300 rounded mb-8 focus:outline-none focus:border-blueColor"
              />
              <ErrorMessage
                name="location"
                component="div"
                className="text-redColor mb-2"
              />
              <h3 className="text-xl mb-2">Projects Deadline</h3>
              <Field
                name="deadline"
                type="date"
                placeholder="Deadline"
                className="block w-full p-2 border border-gray-300 rounded mb-8 focus:outline-none focus:border-blueColor"
              />
              <ErrorMessage
                name="deadline"
                component="div"
                className="text-redColor mb-2"
              />
              <div className="flex items-center mb-2">
                <h3 className="text-xl mr-2">Social Links</h3>
                <p>(optional)</p>
              </div>
              <Field
                name="website"
                placeholder="Website URL"
                className="block w-full p-2 border border-gray-300 rounded mb-8 focus:outline-none focus:border-blueColor"
              />
              <Field
                name="discord"
                placeholder="Discord URL"
                className="block w-full p-2 border border-gray-300 rounded mb-8 focus:outline-none focus:border-blueColor"
              />
              <Field
                name="telegram"
                placeholder="Telegram URL"
                className="block w-full p-2 border border-gray-300 rounded mb-8 focus:outline-none focus:border-blueColor"
              />
              <Field
                name="linkedIn"
                placeholder="LinkedIn URL"
                className="block w-full p-2 border border-gray-300 rounded mb-8 focus:outline-none focus:border-blueColor"
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
                className="text-red-500 mb-2"
              />

              <h3 className="text-xl mb-2">Funding Type</h3>
              <Field
                as="select"
                name="fundingType"
                className="block w-full p-2 border border-gray-300  rounded mb-2 focus:outline-none"
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setFieldValue("fundingType", e.target.value);
                  setSelectedFundingType(e.target.value as FundingType);
                }}
              >
                {Object.values(FundingType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Field>
              <p className="text-sm text-gray-600 mb-4 italic">
                {fundingTypeDescriptions[selectedFundingType]}
              </p>
              <ErrorMessage
                name="fundingType"
                component="div"
                className="text-red-500 mb-2"
              />

              <h3 className="text-xl mb-2">Product or Service Type</h3>
              <Field
                as="select"
                name="productOrService"
                className="block w-full p-2 border border-gray-300  rounded mb-2 focus:outline-none"
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setFieldValue("productOrService", e.target.value);
                  setSelectedProductService(e.target.value as ProductOrService);
                }}
              >
                {Object.values(ProductOrService).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Field>
              <p className="text-sm text-gray-600 mb-4 italic">
                {productServiceDescriptions[selectedProductService]}
              </p>
              <ErrorMessage
                name="productOrService"
                component="div"
                className="text-red-500 mb-2"
              />

              <h3 className="text-xl mb-2">Wallet Address for Funds</h3>
              <Field
                name="walletAddress"
                type="text"
                placeholder="Wallet Address to receive funds"
                className="block w-full p-2 border border-gray-300 focus:border-blueColor rounded mb-4 focus:outline-none"
              />
              <ErrorMessage
                name="walletAddress"
                component="div"
                className="text-red-500 mb-2"
              />
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl mb-2">Review</h2>
              <p className="text-md mb-8 font-thin">
                For this final step, please review all information carefully.
                Once submitted, the details provided here will be fixed and
                cannot be changed. Ensure accuracy before completing your
                submission.
              </p>
              {submitError && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
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
                      <h3 className="text-sm font-medium text-red-800">
                        Error Creating Campaign
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {submitError}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded ${
                currentStep === 0 ? "bg-gray-300" : "bg-blueColor text-white"
              }`}
            >
              Previous
            </button>

            {currentStep === steps.length - 1 ? (
              <button
                type="submit"
                className="px-4 py-2 bg-blueColor text-white rounded"
                onClick={() => {
                  if (!isPending) {
                    setSubmitError(null);
                    submitForm();
                  }
                }}
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center">
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
                onClick={() =>
                  validateForm().then((errors) => {
                    console.log("Validation Errors:", errors);
                    if (Object.keys(errors).length === 0) {
                      setCurrentStep((prev) => prev + 1);
                    }
                  })
                }
                className="px-4 py-2 bg-blueColor text-white rounded"
              >
                Next
              </button>
            )}
          </div>
        </form>
      )}
    </Formik>
  );
}
