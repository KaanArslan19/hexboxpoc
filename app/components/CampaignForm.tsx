"use client";
import React, { useState } from "react";
import { Formik, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Steps } from "antd";
import ImageSelector from "./ui/ImageSelector";
import { NewCampaignInfo } from "../types";
import CreateWallet from "./CreateWallet";

const steps = [
  { title: "Project Info" },
  { title: "Details" },
  // { title: "Payment Info" },
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
    oneLiner: Yup.string().required("One Liner is required"),
    logo: fileSizeValidator.required("Logo is required"),
    /*     backgroundImage: fileSizeValidator.required("Background image is required"), */
  }),
  Yup.object({
    description: Yup.string().required("Description is required"),
    location: Yup.string().required("Location is required"),
    deadline: Yup.date()
      .required("Project Deadline date is required")
      .min(new Date(), "Deadline must be in the future"),
    fundAmount: Yup.number()
      .typeError("Fund amount must be a number")
      .required("Fund amount is required")
      .min(0.0000001, "Fund amount must be greater than 0"),
    totalSupply: Yup.number()
      .typeError("Total supply must be a number")
      .required("Total supply is required")
      .min(1, "Total supply must be greater than 1"),
  }),
  // Yup.object({
  //   hexboxAddress: Yup.string().required("Hexbox address is required"),
  // }),
];

const initialValues = {
  title: "",
  description: "",
  fundAmount: "",
  //hexboxAddress: "",
  logo: null,
  /*   backgroundImage: null,
   */
  totalSupply: 0,
};

interface Props {
  onSubmit(values: NewCampaignInfo): void;
  onImageRemove?(source: string): void;
}

export default function CampaignForm(props: Props) {
  const { onSubmit, onImageRemove } = props;
  const [isPending, setIsPending] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [logo, setLogo] = useState<File | null>(null);
  const [walletInfo, setWalletInfo] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);

  const handleSubmit = async (values: typeof initialValues) => {
    setIsPending(true);
    const projectData: NewCampaignInfo = {
      title: values.title,
      description: values.description,
      fundAmount: Number(values.fundAmount),  
      logo: values.logo!,
      /*       backgroundImage: values.backgroundImage!,
<<<<<<< Updated upstream
       */ 
      // hexboxAddress: values.hexboxAddress,
      totalSupply: 0,
=======
       */
      hexboxAddress: values.hexboxAddress,
>>>>>>> Stashed changes
    };
    try {
      await onSubmit(projectData);
    } catch (error) {
      console.error(error);
      setIsPending(false);
    }
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
                className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none  focus:border-blueColor"
              />
              <ErrorMessage
                name="title"
                component="div"
                className="text-red-500 mb-2"
              />
              <h3 className="text-xl mb-2">Projects One Liner</h3>
              <Field
                name="oneLiner"
                placeholder="One Liner"
                className="block w-full p-2 border border-gray-300 rounded  mb-8 focus:outline-none focus:border-blueColor"
              />
              <ErrorMessage
                name="oneLiner"
                component="div"
                className="text-red-500 mb-2"
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

              {/*   <h3>Background Image</h3>
              <ImageSelector
                id="backgroundImage"
                images={
                  backgroundImage ? [URL.createObjectURL(backgroundImage)] : []
                }
                onChange={({ target }) => {
                  const file = target.files ? target.files[0] : null;
                  setFieldValue("backgroundImage", file);
                  setBackgroundImage(target.files ? target.files[0] : null);
                }}
              /> */}
              <ErrorMessage
                name="logo"
                component="div"
                className="text-red-500 mb-2"
              />
              {/* <ErrorMessage
                name="backgroundImage"
                component="div"
                className="text-red-500 mb-2"
              /> */}
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
                className="text-red-500 mb-2"
              />
              <h3 className="text-xl mb-2">Projects Location</h3>
              <Field
                name="location"
                placeholder="Location"
                className="block w-full p-2 border border-gray-300 rounded  mb-8 focus:outline-none focus:border-blueColor"
              />
              <ErrorMessage
                name="location"
                component="div"
                className="text-red-500 mb-2"
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
                className="text-red-500 mb-2"
              />
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

              <h3 className="text-xl mb-2">Total token supply</h3>
              <Field
                name="totalSupply"
                type="text"
                placeholder="Total Supply"
                className="block w-full p-2 border border-gray-300 focus:border-blueColor rounded mb-4 focus:outline-none"
                min="1"
              />
            </div>
          )}
          
          {/*
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl mb-2">Payment Info</h2>
              <p className="text-md mb-8 font-thin">
                Create a Hexbox wallet to receive funding for your campaign.
                This wallet will securely store the funds raised and enable you
                to manage and withdraw contributions. Make sure to set it up
                before launching your campaign.
              </p>
              <h3 className="text-xl mb-2">Hexbox Wallet Address</h3>
              <CreateWallet
                disabled={!!walletInfo}
                onWalletInfo={(walletInfo) => {
                  setWalletInfo(JSON.stringify(walletInfo));
                  setFieldValue("hexboxAddress", JSON.stringify(walletInfo));
                  console.log(walletInfo);
                }}
              />
              {walletInfo && (
                <p className="text-md mb-8 font-thin text-green-500">
                  Wallet created successfully. Proceed to the next step.
                </p>
              )}
              <ErrorMessage
                name="hexboxAddress"
                component="div"
                className="text-red-500 mb-2"
              />
            </div>
          )}
          */}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl mb-2">Review</h2>
              <p className="text-md mb-8 font-thin">
                For this final step, please review all information carefully.
                Once submitted, the details provided here will be fixed and
                cannot be changed. Ensure accuracy before completing your
                submission.
              </p>
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
                  if (!isPending) submitForm();
                }}
                disabled={isPending}
              >
                {isPending ? "Submitting..." : "Submit"}
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
