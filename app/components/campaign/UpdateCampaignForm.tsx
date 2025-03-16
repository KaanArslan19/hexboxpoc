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
import {
  fundingTypesDisplayNames,
  productServiceDisplayNames,
} from "../../lib/auth/utils/productServiceDisplayNames";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  product_or_service: ProductOrService;
  social_links: {
    telegram: string;
    discord: string;
    website: string;
    linkedIn: string;
  };
}
const FILE_SIZE_LIMIT = 1024 * 1024; // 1MB in bytes
const fileSizeValidator = Yup.mixed().test(
  "fileSize",
  "File size must be less than 1MB",
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
const validationSchema = [
  Yup.object({
    title: Yup.string().required("Title is required"),
    one_liner: Yup.string().required("One Liner is required"),
    logo: fileSizeValidator.required("Logo is required"),
  }),
  Yup.object({
    description: Yup.string().required("Description is required"),
    location: Yup.string().required("Location is required"),
    email: Yup.string().required("Email is required"),
    phoneNumber: Yup.string().required("Phone Number is required"),
  }),
  Yup.object({
    fund_amount: Yup.number()
      .typeError("Fund amount must be a number")
      .required("Fund amount is required")
      .min(0.0000001, "Fund amount must be greater than 0"),
    product_or_service: Yup.string()
      .required("Product/Service type is required")
      .oneOf(
        [
          ProductOrService.ProductOnly,
          ProductOrService.ServiceOnly,
          ProductOrService.ProductAndService,
        ],
        "Invalid product/service type"
      ),
    wallet_address: Yup.string().required("Wallet address is required"),
  }),
  Yup.object({
    funding_type: Yup.string()
      .oneOf(Object.values(FundingType))
      .required("Please select a funding type"),
  }),
];

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
  product_or_service: ProductOrService.ProductAndService,
};
interface Props {
  onSubmit(values: CampaignInfoUpdate): void;
  onImageRemove?(source: string): void;
  initialValuesProp: InitialCampaignValue;
}
const productServiceDescriptions = {
  [ProductOrService.ProductOnly]:
    "Your campaign offers only physical or digital products to backers.",
  [ProductOrService.ServiceOnly]:
    "Your campaign offers only services or experiences to backers.",
  [ProductOrService.ProductAndService]:
    "Your campaign offers both products and services to backers.",
};
export default function UpdateCampaignForm(props: Props) {
  const { onSubmit, onImageRemove, initialValuesProp } = props;
  const [isPending, setIsPending] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoSource, setLogoSource] = useState<string[]>();
  const [campaignInfo, setCampaignInfo] = useState({ ...defaultValues });
  const [selectedFundingType, setSelectedFundingType] = useState<FundingType>(
    FundingType.Limitless
  );

  const { address } = useAccount();
  const onLogoChange = (file: File) => {
    setLogo(file);
    setLogoSource([URL.createObjectURL(file)]);
  };
  const [selectedProductService, setSelectedProductService] =
    useState<ProductOrService>(ProductOrService.ServiceOnly);
  useEffect(() => {
    if (initialValuesProp) {
      const campaignData = {
        title: initialValuesProp.title,
        email: initialValuesProp.email || "",
        phoneNumber: initialValuesProp.phoneNumber || "",
        description: initialValuesProp.description,
        logo: initialValuesProp.logo
          ? initialValuesProp.logo instanceof File
            ? URL.createObjectURL(initialValuesProp.logo)
            : initialValuesProp.logo.startsWith("http") ||
              initialValuesProp.logo.startsWith("/")
            ? initialValuesProp.logo
            : `${BASE_URL}${initialValuesProp.logo}`
          : "",
        deadline: initialValuesProp.deadline
          ? new Date(initialValuesProp.deadline).toISOString().split("T")[0]
          : "",
        location: initialValuesProp.location,
        one_liner: initialValuesProp.one_liner,
        telegram: initialValuesProp.social_links?.telegram || "",
        discord: initialValuesProp.social_links?.discord || "",
        website: initialValuesProp.social_links?.website || "",
        linkedIn: initialValuesProp.social_links?.linkedIn || "",
        funding_type: initialValuesProp.funding_type,
        product_or_service: initialValuesProp.product_or_service,
        fund_amount: initialValuesProp.fund_amount,
        wallet_address: initialValuesProp.wallet_address,
      };

      setCampaignInfo(campaignData);
      setLogoSource([campaignData.logo]); // Ensure ImageSelector gets a valid URL
    }
  }, [initialValuesProp]);
  console.log("initialValuesProp", initialValuesProp);
  const handleSubmit = async (values: typeof defaultValues) => {
    console.log("valuesClient", values);
    setIsPending(true);
    setSubmitError(null);

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
      product_or_service: values.product_or_service as ProductOrService,
    };

    try {
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
  console.log(initialValuesProp);
  return (
    <Formik
      initialValues={campaignInfo}
      validationSchema={validationSchema[currentStep]}
      enableReinitialize={true}
      validateOnMount={true}
      onSubmit={handleSubmit}
    >
      {({ validateForm, setFieldValue, submitForm, values }) => (
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
              className="block w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blueColor"
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
              className="block w-full p-2 border border-gray-300 rounded mb-8 focus:outline-none focus:border-blueColor"
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
              images={logoSource}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onLogoChange(e.target.files[0]);
                  setFieldValue("logo", e.target.files[0]);
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
                className="block w-full p-2 border border-gray-300 focus:border-blueColor rounded mb-4 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setFieldValue("walletAddress", address)}
                className="group relative px-2 py-2 bg-blueColor text-white rounded hover:bg-blueColor/80 h-[42px] flex items-center justify-center"
              >
                <TiAttachment className="w-8 h-8 " style={{ fill: "white" }} />
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
              className="block w-full p-2 border border-gray-300 rounded  mb-2 focus:outline-none focus:border-blueColor"
              value={values.fund_amount}
            />
            <ErrorMessage
              name="fund_amount"
              component="div"
              className="text-redColor/80 mb-2"
            />
            <h3 className="text-xl mb-2">Funding Type</h3>
            <Field
              as="select"
              name="funding_type"
              className="block w-full p-2 border border-gray-300  rounded mb-2 focus:outline-none"
              value={values.funding_type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setFieldValue("funding_type", e.target.value);
                setSelectedFundingType(e.target.value as FundingType);
              }}
            >
              {Object.values(fundingTypesDisplayNames).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Field>

            <ErrorMessage
              name="funding_type"
              component="div"
              className="text-redColor/80 mb-2"
            />
            <h3 className="text-xl mb-2">Product or Service Type</h3>
            <Field
              as="select"
              name="product_or_service"
              className="block w-full p-2 border border-gray-300  rounded mb-2 focus:outline-none"
              value={values.product_or_service}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setFieldValue("product_or_service", e.target.value);
                setSelectedProductService(e.target.value as ProductOrService);
              }}
            >
              {Object.values(productServiceDisplayNames).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Field>
            <p className="text-sm text-gray-600 mb-4 italic">
              {productServiceDescriptions[selectedProductService]}
            </p>
            <ErrorMessage
              name="product_or_service"
              component="div"
              className="text-redColor/80 mb-2"
            />
          </div>
          <div>
            <h2 className="text-2xl mb-2">Details</h2>
            <p className="text-md mb-8 font-thin">
              Provide the essential details about your campaign including
              campaign description, location, deadline, and contact information.
              These details help potential supporters understand your campaign
              and how to reach you.
            </p>
            <div className="mb-2">
              <h3 className="text-xl mb-2">Campaigns Description</h3>

              <Field
                as="textarea"
                name="description"
                placeholder="Write your description using Markdown..."
                className="block w-full p-2 border border-gray-300 rounded h-32 mb-4 focus:outline-none focus:border-blue-500"
              />

              <ErrorMessage
                name="description"
                component="div"
                className="text-red-500 mb-2"
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

            <h3 className="text-xl mb-2">Campaign Location</h3>
            <Field
              name="location"
              placeholder="Location"
              className="block w-full p-2 border border-gray-300 rounded mb-8 focus:outline-none focus:border-blueColor"
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
              className="block w-full p-2 border border-gray-300 rounded mb-8 focus:outline-none focus:border-blueColor"
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
              className="block w-full p-2 border border-gray-300 rounded mb-8 focus:outline-none focus:border-blueColor"
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
              className="block w-full p-2 border border-gray-300 rounded mb-8 focus:outline-none focus:border-blueColor"
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
              className="block w-full p-2 border border-gray-300 rounded mb-8 focus:outline-none focus:border-blueColor"
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
              className="block w-full p-2 border border-gray-300 rounded mb-8 focus:outline-none focus:border-blueColor"
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
              className="block w-full p-2 border border-gray-300 rounded mb-8 focus:outline-none focus:border-blueColor"
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
              className="block w-full p-2 border border-gray-300 rounded mb-8 focus:outline-none focus:border-blueColor"
              value={values.linkedIn}
            />
            <ErrorMessage
              name="linkedIn"
              component="div"
              className="text-redColor/80 mb-2"
            />
          </div>

          <button
            type="submit"
            className="block w-full bg-blueColor text-white p-2 rounded mt-4"
            onClick={submitForm}
            disabled={isPending}
          >
            {isPending ? "Submitting..." : "Submit"}
          </button>
          {submitError && (
            <div className="text-redColor/80 mt-4">{submitError}</div>
          )}
        </form>
      )}
    </Formik>
  );
}
