"use client";
import React, { useState, ChangeEventHandler, useRef } from "react";
import { Formik, Field, ErrorMessage, FormikProps } from "formik";
import * as Yup from "yup";
import { Steps } from "antd";
import ImageSelector from "./ui/ImageSelector";
import { ProductNew, ProductCategory, ProductOrService } from "../types";
import { toast } from "react-toastify";
import { fileValidator } from "../utils/imageValidators";
import TurnstileWidget from "./ui/TurnstileWidget";
import {
  inputClass,
  textareaClass,
  selectClass,
  checkClass,
} from "../utils/formClasses";
const steps = [
  { title: "Basic Info" },
  { title: "Details" },
  { title: "Pricing & Inventory" },
  { title: "Shipping & Terms" },
  { title: "Review" },
];

type ProductFormValues = Omit<
  ProductNew,
  "inventory" | "freeShipping" | "productReturnPolicy"
> & {
  inventory?: ProductNew["inventory"];
  freeShipping?: boolean;
  productReturnPolicy?: ProductNew["productReturnPolicy"];
  service_terms?: {
    contract_time_begining: string;
    contract_length: string;
  };
  isUnlimitedStock: boolean;
  turnstileToken?: string;
};

const baseValidationSchemas = {
  basicInfo: Yup.object({
    name: Yup.string()
      .max(60, "Product name must be 60 characters or less")
      .required("Name is required"),
    logo: fileValidator.required("Logo is required"),
    images: Yup.array().of(fileValidator),
    manufacturerId: Yup.string().max(
      60,
      "Manufacturer ID must be 60 characters or less"
    ),
    type: Yup.string().required("Type is required"),
    countryOfOrigin: Yup.string().max(
      60,
      "Country of origin must be 60 characters or less"
    ),
  }),

  details: Yup.object({
    description: Yup.string()
      .max(10000, "Description must be 10000 characters or less")
      .required("Description is required"),
    category: Yup.object({
      name: Yup.string().required("Category is required"),
    }),
    fulfillmentDetails: Yup.string().max(
      1500,
      "Fulfillment details must be 1500 characters or less"
    ),
    deliveryDate: Yup.string(),
  }),

  pricingProduct: Yup.object({
    price: Yup.object({
      amount: Yup.number()
        .typeError("Price must be a number")
        .required("Price is required")
        .positive("Price must be greater than 0")
        .max(1000000000000, "Price must be less than 1 trillion"),
      tax_inclusive: Yup.boolean().required("Tax inclusive status is required"),
      gst_rate: Yup.number().when("tax_inclusive", {
        is: true,
        then: (schema) =>
          schema
            .min(0, "GST rate cannot be negative")
            .max(90, "GST rate cannot exceed 90%")
            .max(99999, "GST rate must be 5 characters or less")
            .required("GST rate is required"),
        otherwise: (schema) => schema.nullable(),
      }),
      gst_amount: Yup.number().when("tax_inclusive", {
        is: true,
        then: (schema) =>
          schema
            .min(0, "GST amount cannot be negative")
            .max(99999, "GST amount must be 5 characters or less")
            .required("GST amount is required"),
        otherwise: (schema) => schema.nullable(),
      }),
    }),
    inventory: Yup.object({
      stock_level: Yup.number()
        .typeError("Stock level must be a number")
        .integer("Stock level must be an integer")
        .min(1, "Stock level must be at least 1")
        .max(1000000000000, "Stock level must be less than 1 trillion"),
    }),
  }),

  pricingService: Yup.object({
    price: Yup.object({
      amount: Yup.number()
        .typeError("Price must be a number")
        .required("Price is required")
        .positive("Price must be greater than 0")
        .max(1000000000000, "Price must be less than 1 trillion"),
      tax_inclusive: Yup.boolean().required("Tax inclusive status is required"),
      gst_rate: Yup.number().when("tax_inclusive", {
        is: true,
        then: (schema) =>
          schema
            .min(0, "GST rate cannot be negative")
            .max(90, "GST rate cannot exceed 90%")
            .max(99999, "GST rate must be 5 characters or less")
            .required("GST rate is required"),
        otherwise: (schema) => schema.nullable(),
      }),
      gst_amount: Yup.number().when("tax_inclusive", {
        is: true,
        then: (schema) =>
          schema
            .min(0, "GST amount cannot be negative")
            .max(99999, "GST amount must be 5 characters or less")
            .required("GST amount is required"),
        otherwise: (schema) => schema.nullable(),
      }),
    }),
    inventory: Yup.object({
      stock_level: Yup.number()
        .typeError("Stock level must be a number")
        .integer("Stock level must be an integer")
        .min(1, "Stock level must be at least 1")
        .max(1000000000000, "Stock level must be less than 1 trillion"),
    }),
    isUnlimitedStock: Yup.boolean(),
  }),

  // Shipping & Terms - different for product vs service
  shippingProduct: Yup.object({
    freeShipping: Yup.boolean().required("Free shipping status is required"),
    productReturnPolicy: Yup.object({
      eligible: Yup.boolean().required("Return eligibility is required"),
      return_period_days: Yup.number().when("eligible", {
        is: true,
        then: (schema) =>
          schema
            .integer("Return period must be a whole number")
            .min(1, "Return period must be greater than 0")
            .max(9999999999, "Return period must be 10 characters or less")
            .required("Return period is required"),
        otherwise: (schema) => schema.nullable(),
      }),
      conditions: Yup.string().when("eligible", {
        is: true,
        then: (schema) =>
          schema
            .max(1000, "Return conditions must be 1000 characters or less")
            .required("Return conditions are required"),
        otherwise: (schema) => schema.nullable(),
      }),
    }),
  }),

  serviceTerms: Yup.object({
    service_terms: Yup.object({
      contract_time_begining: Yup.string().required(
        "Contract start time is required"
      ),
      contract_length: Yup.string().required("Contract length is required"),
    }),
  }),
};

const getValidationSchema = (type: string, step: number) => {
  const isService = type === ProductOrService.ServiceOnly;

  switch (step) {
    case 0:
      return baseValidationSchemas.basicInfo;
    case 1:
      return baseValidationSchemas.details;
    case 2:
      return isService
        ? baseValidationSchemas.pricingService
        : baseValidationSchemas.pricingProduct;
    case 3:
      return isService
        ? baseValidationSchemas.serviceTerms
        : baseValidationSchemas.shippingProduct;
    case 4:
      // Add turnstile verification to the final step
      return Yup.object({
        turnstileToken: Yup.string().required(
          "Please complete the security verification"
        ),
      });
    default:
      return Yup.object({});
  }
};

const productInitialValues: ProductFormValues = {
  manufacturerId: "",
  name: "",
  type: ProductOrService.ProductOnly,
  countryOfOrigin: "",
  category: { name: ProductCategory.TECH },
  description: "",
  price: {
    amount: 0,
    tax_inclusive: false,
    gst_rate: 0,
    gst_amount: 0,
  },
  inventory: {
    stock_level: 1,
  },
  freeShipping: false,
  productReturnPolicy: {
    eligible: true,
    return_period_days: 30,
    conditions: "",
  },
  campaignId: "",
  userId: "",
  logo: "",
  images: [],
  status: "draft",
  fulfillmentDetails: "",
  deliveryDate: "",
  isUnlimitedStock: false,
};

const serviceInitialValues: ProductFormValues = {
  ...productInitialValues,
  type: ProductOrService.ServiceOnly,
  inventory: {
    stock_level: 1,
  },
  freeShipping: undefined,
  productReturnPolicy: undefined,
  service_terms: {
    contract_time_begining: "",
    contract_length: "2 hours",
  },
  isUnlimitedStock: false,
};

interface Props {
  productOrService: string;
  onSubmit(values: ProductNew): void;
  onImageRemove?(source: string): void;
  isSubmitting?: boolean;
}

export default function ProductForm({
  onSubmit,
  onImageRemove,
  productOrService,
  isSubmitting = false,
}: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formType, setFormType] = useState<string>(
    ProductOrService.ProductOnly
  );

  // Turnstile related state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [isVerifyingTurnstile, setIsVerifyingTurnstile] = useState(false);

  // All hooks must be called before any early returns
  const formikRef = useRef<FormikProps<ProductFormValues> | null>(null);

  // Get Turnstile site key from environment variables
  const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

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

  // Update form steps based on product/service type
  const getStepTitle = (index: number) => {
    if (index === 3) {
      return formType === ProductOrService.ServiceOnly
        ? "Service Terms"
        : "Shipping & Returns";
    }
    return steps[index].title;
  };

  const onImagesChange: ChangeEventHandler<HTMLInputElement> = ({ target }) => {
    const files = target.files;
    if (files) {
      const newImages = Array.from(files).map((item) => item);
      setImageFiles([...imageFiles, ...newImages]);

      // Create data URLs for new images
      newImages.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setImagePreviews((prev) => [...prev, dataUrl]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = async (index: number) => {
    if (!imagePreviews) return;

    const imageToRemove = imagePreviews[index];
    const cloudSourceUrl = "pub-7337cfa6ce8741dea70792ea29aa86e7.r2.dev";

    if (imageToRemove.startsWith(cloudSourceUrl)) {
      onImageRemove && onImageRemove(imageToRemove);
    } else {
      const fileIndexDifference = imagePreviews.length - imageFiles.length;
      const indexToRemove = index - fileIndexDifference;

      const newImageFiles = imageFiles.filter((_, i) => i !== indexToRemove);
      setImageFiles([...newImageFiles]);
    }

    const newImagePreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews([...newImagePreviews]);
  };

  // Simplified function - no frontend validation to prevent double validation
  const verifyTurnstileToken = async (token: string): Promise<boolean> => {
    // Just store the token and mark as verified for UI purposes
    // Actual validation happens server-side during form submission
    console.log("Turnstile token received:", token.substring(0, 20) + "...");

    setTurnstileToken(token);
    setIsTurnstileVerified(true);
    setTurnstileError(null);
    setIsVerifyingTurnstile(false);

    // Set the token in the form
    if (formikRef.current) {
      formikRef.current.setFieldValue("turnstileToken", token);
    }

    console.log("Turnstile token stored for server-side validation");
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
    } else {
      console.log("Turnstile verification successful!");
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

  const handleSubmit = async (values: ProductFormValues) => {
    setIsPending(true);
    setSubmitError(null);

    try {
      // Final turnstile verification before submission
      if (!isTurnstileVerified || !turnstileToken) {
        throw new Error("Please complete the security verification");
      }

      const { isUnlimitedStock, ...restValues } = values;

      const productData: any = {
        ...restValues,
        logo: restValues.logo as string,
        images: imageFiles,
        turnstileToken: turnstileToken, // Include Turnstile token for server-side validation
      };

      if (
        productData.type === ProductOrService.ServiceOnly &&
        isUnlimitedStock
      ) {
        delete productData.inventory;
      } else if (productData.inventory?.stock_level !== undefined) {
        productData.inventory.stock_level = Number(
          productData.inventory.stock_level
        );
      }
      console.log("productData", productData);

      await onSubmit(productData);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Formik<ProductFormValues>
      innerRef={formikRef}
      initialValues={
        formType === ProductOrService.ServiceOnly
          ? serviceInitialValues
          : productInitialValues
      }
      validationSchema={Yup.lazy(() =>
        getValidationSchema(formType, currentStep)
      )}
      validateOnChange={true}
      validateOnBlur={true}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ validateForm, setFieldValue, submitForm, values }) => (
        <form
          onSubmit={(e) => e.preventDefault()}
          className="p-6 max-w-4xl mx-auto"
        >
          <h1 className="text-3xl text-center mb-4">
            Create a
            {formType === ProductOrService.ServiceOnly
              ? " Service"
              : " Product"}
          </h1>
          <div className="mb-6">
            <Steps
              progressDot
              current={currentStep}
              responsive
              items={steps.map((step, index) => ({
                title: getStepTitle(index),
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
              <h2 className="text-2xl mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl mb-2">Type</h3>
                  {productOrService !== ProductOrService.ProductAndService && (
                    <Field
                      as="select"
                      name="type"
                      className={selectClass}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        const newType = e.target.value;
                        setFieldValue("type", newType);
                        setFormType(newType);
                      }}
                    >
                      <option value={ProductOrService.ProductOnly}>
                        Product
                      </option>
                      <option value={ProductOrService.ServiceOnly}>
                        Service
                      </option>
                    </Field>
                  )}

                  <ErrorMessage
                    name="type"
                    component="div"
                    className="text-redColor"
                  />
                </div>
                <div>
                  <h3 className="text-xl mb-2">Name</h3>
                  <Field
                    name="name"
                    placeholder={
                      formType === ProductOrService.ServiceOnly
                        ? "Service Name"
                        : "Product Name"
                    }
                    className={inputClass}
                  />
                  <ErrorMessage
                    name="name"
                    component="div"
                    className="text-redColor"
                  />
                </div>

                <div>
                  <h3 className="text-xl mb-2">Logo</h3>
                  <ImageSelector
                    id="logo"
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
                    className="text-redColor"
                  />
                </div>
                <div>
                  <h3 className="text-xl mb-2">Images</h3>
                  <ImageSelector
                    multiple
                    id="images"
                    images={imagePreviews}
                    onRemove={removeImage}
                    onChange={onImagesChange}
                  />
                  <ErrorMessage
                    name="images"
                    component="div"
                    className="text-redColor"
                  />
                </div>
                <div>
                  <h3 className="text-xl mb-2">Manufacturer ID (Optional)</h3>
                  <Field
                    name="manufacturerId"
                    placeholder="Manufacturer ID"
                    className={inputClass}
                  />
                  <ErrorMessage
                    name="manufacturerId"
                    component="div"
                    className="text-redColor"
                  />
                </div>

                <div>
                  <h3 className="text-xl mb-2">Country of Origin (Optional)</h3>
                  <Field
                    name="countryOfOrigin"
                    placeholder="Country of Origin"
                    className={inputClass}
                  />
                  <ErrorMessage
                    name="countryOfOrigin"
                    component="div"
                    className="text-redColor"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl mb-4">
                {formType === ProductOrService.ServiceOnly
                  ? "Service"
                  : "Product"}{" "}
                Details
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl mb-2">Description</h3>
                  <Field
                    as="textarea"
                    name="description"
                    placeholder={
                      formType === ProductOrService.ServiceOnly
                        ? "Service Description"
                        : "Product Description"
                    }
                    className={textareaClass + " h-24"}
                  />
                  <ErrorMessage
                    name="description"
                    component="div"
                    className="text-redColor"
                  />
                </div>

                <div>
                  <h3 className="text-xl mb-2">Category</h3>
                  <Field
                    as="select"
                    name="category.name"
                    className={selectClass}
                  >
                    {Object.values(ProductCategory).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="category.name"
                    component="div"
                    className="text-redColor"
                  />
                </div>

                <div>
                  <h3 className="text-xl mb-2">Fulfillment Details</h3>
                  <Field
                    as="textarea"
                    name="fulfillmentDetails"
                    placeholder="Enter fulfillment details"
                    className={textareaClass + " h-24"}
                  />
                  <ErrorMessage
                    name="fulfillmentDetails"
                    component="div"
                    className="text-redColor"
                  />
                </div>

                <div>
                  <h3 className="text-xl mb-2">Delivery Date</h3>
                  <Field
                    type="date"
                    name="deliveryDate"
                    className={inputClass}
                  />
                  <ErrorMessage
                    name="deliveryDate"
                    component="div"
                    className="text-redColor"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl mb-4">
                {formType === ProductOrService.ServiceOnly
                  ? "Pricing"
                  : "Pricing & Inventory"}
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl mb-2">Price Amount (USDC)</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Please enter the price in USDC currency
                  </p>
                  <Field
                    name="price.amount"
                    type="number"
                    placeholder="Price"
                    className={inputClass}
                  />
                  <ErrorMessage
                    name="price.amount"
                    component="div"
                    className="text-redColor"
                  />
                </div>
                <div>
                  <h3 className="text-xl mb-2">Tax Details</h3>

                  <label className="block mb-2">
                    <Field
                      type="checkbox"
                      name="price.tax_inclusive"
                      className={checkClass}
                    />
                    <span className="ml-2">Tax Inclusive</span>
                  </label>
                  <ErrorMessage
                    name="price.tax_inclusive"
                    component="p"
                    className="text-red-500 text-sm"
                  />

                  <Field name="price.tax_inclusive">
                    {({ field: { value } }: { field: { value: boolean } }) =>
                      value && (
                        <>
                          <Field
                            name="price.gst_rate"
                            type="number"
                            placeholder="GST Rate (%)"
                            className={inputClass + " mb-1"}
                          />
                          <ErrorMessage
                            name="price.gst_rate"
                            component="p"
                            className="text-red-500 text-sm"
                          />

                          <Field
                            name="price.gst_amount"
                            type="number"
                            placeholder="GST Amount"
                            className={inputClass}
                          />
                          <ErrorMessage
                            name="price.gst_amount"
                            component="p"
                            className="text-red-500 text-sm"
                          />
                        </>
                      )
                    }
                  </Field>
                </div>

                {(formType === ProductOrService.ProductOnly ||
                  formType === ProductOrService.ServiceOnly) && (
                  <div>
                    <h3 className="text-xl mb-2">
                      {formType === ProductOrService.ServiceOnly
                        ? "Capacity"
                        : "Stock Level (Optional)"}
                    </h3>
                    {formType === ProductOrService.ServiceOnly && (
                      <div className="mb-2 space-y-1">
                        <Field name="isUnlimitedStock">
                          {({
                            field,
                          }: {
                            field: {
                              value: boolean;
                              name: string;
                              onBlur: any;
                              onChange: any;
                            };
                          }) => {
                            const { value, ...checkboxField } = field;
                            return (
                              <label className="inline-flex items-center">
                                <input
                                  type="checkbox"
                                  {...checkboxField}
                                  checked={Boolean(value)}
                                  className={checkClass}
                                  onChange={(event) => {
                                    const checked = event.target.checked;
                                    checkboxField.onChange(event);
                                    const currentStock = Number(
                                      values.inventory?.stock_level ?? 0
                                    );
                                    if (checked) {
                                      setFieldValue(
                                        "inventory.stock_level",
                                        currentStock > 0 ? currentStock : 1
                                      );
                                    } else if (currentStock < 1) {
                                      setFieldValue("inventory.stock_level", 1);
                                    }
                                  }}
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  Unlimited availability
                                </span>
                              </label>
                            );
                          }}
                        </Field>
                        <p className="text-xs text-gray-500">
                          Uncheck to limit the number of bookings for this
                          service.
                        </p>
                      </div>
                    )}
                    <Field
                      name="inventory.stock_level"
                      type="number"
                      placeholder={
                        formType === ProductOrService.ServiceOnly
                          ? "Maximum bookings"
                          : "Stock Level"
                      }
                      className={inputClass}
                      disabled={
                        formType === ProductOrService.ServiceOnly &&
                        values.isUnlimitedStock
                      }
                    />
                    <ErrorMessage
                      name="inventory.stock_level"
                      component="div"
                      className="text-redColor"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && formType === ProductOrService.ProductOnly && (
            <div>
              <h2 className="text-2xl mb-4">Shipping & Returns</h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-4">
                    <Field
                      type="checkbox"
                      name="freeShipping"
                      className={checkClass}
                    />
                    <span className="ml-2">Free Shipping</span>
                  </label>
                </div>

                <div>
                  <h3 className="text-xl mb-2">Return Policy</h3>
                  <label className="block mb-2">
                    <Field
                      type="checkbox"
                      name="productReturnPolicy.eligible"
                      className={checkClass}
                    />
                    <span className="ml-2">Returns Eligible</span>
                  </label>

                  <Field name="productReturnPolicy.eligible">
                    {({ field: { value } }: { field: { value: boolean } }) =>
                      value && (
                        <>
                          <Field
                            name="productReturnPolicy.return_period_days"
                            type="number"
                            placeholder="Return Period (days)"
                            className={inputClass + " mb-2"}
                          />
                          <ErrorMessage
                            name="productReturnPolicy.return_period_days"
                            component="div"
                            className="text-redColor mb-2"
                          />

                          <Field
                            as="textarea"
                            name="productReturnPolicy.conditions"
                            placeholder="Return Conditions"
                            className={textareaClass + " h-24"}
                          />
                          <ErrorMessage
                            name="productReturnPolicy.conditions"
                            component="div"
                            className="text-redColor"
                          />
                        </>
                      )
                    }
                  </Field>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && formType === ProductOrService.ServiceOnly && (
            <div>
              <h2 className="text-2xl mb-4">Service Terms</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl mb-2">Contract Start Time</h3>
                  <Field
                    type="date"
                    name="service_terms.contract_time_begining"
                    className={inputClass}
                  />
                  <ErrorMessage
                    name="service_terms.contract_time_begining"
                    component="div"
                    className="text-redColor"
                  />
                </div>

                <div>
                  <h3 className="text-xl mb-2">Contract Length</h3>
                  <Field
                    name="service_terms.contract_length"
                    placeholder="e.g. 2 hours, 3 days, 1 week"
                    className={inputClass}
                  />
                  <ErrorMessage
                    name="service_terms.contract_length"
                    component="div"
                    className="text-redColor"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl mb-4">Review</h2>
              <p className="text-md mb-8 font-thin">
                Please review all{" "}
                {formType === ProductOrService.ServiceOnly
                  ? "service"
                  : "product"}{" "}
                details before submitting. Once submitted, the details provided
                here will be fixed and cannot be changed. Ensure accuracy before
                completing your submission.
              </p>

              {/* Security Verification Section */}
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Security Verification
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Please complete the security verification below to proceed
                  with your{" "}
                  {formType === ProductOrService.ServiceOnly
                    ? "service"
                    : "product"}{" "}
                  submission.
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
                  <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 dark:border-blue-400 mr-2"></div>
                      Verifying security token...
                    </div>
                  </div>
                )}

                {turnstileError && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-md p-2">
                    {turnstileError}
                  </div>
                )}
              </div>

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
                        Error Creating{" "}
                        {formType === ProductOrService.ServiceOnly
                          ? "Service"
                          : "Product"}
                      </h3>
                      <div className="mt-2 text-sm text-red-700 break-words max-w-full">
                        {submitError}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-4">
            <button
              type="button"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Back
            </button>
            {currentStep < steps.length - 1 && (
              <button
                type="button"
                onClick={() =>
                  validateForm().then((errors) => {
                    console.log("Validation Errors:", errors);
                    if (Object.keys(errors).length === 0) {
                      setCurrentStep((prev) => prev + 1);
                    } else {
                      Object.entries(errors).forEach(([field, error]) => {
                        if (typeof error === "string") {
                          const truncatedMessage =
                            error.length > 100
                              ? error.substring(0, 100) + "..."
                              : error;
                          toast.error(`${field}: ${truncatedMessage}`, {
                            autoClose: 5000,
                            style: {
                              maxWidth: "400px",
                              wordWrap: "break-word",
                              whiteSpace: "pre-wrap",
                            },
                          });
                        } else if (error && typeof error === "object") {
                          Object.entries(error).forEach(
                            ([subField, subError]) => {
                              const subErrorMessage =
                                typeof subError === "string"
                                  ? subError
                                  : String(subError);
                              const truncatedSubMessage =
                                subErrorMessage.length > 100
                                  ? subErrorMessage.substring(0, 100) + "..."
                                  : subErrorMessage;
                              toast.error(
                                `${field}.${subField}: ${truncatedSubMessage}`,
                                {
                                  autoClose: 5000,
                                  style: {
                                    maxWidth: "400px",
                                    wordWrap: "break-word",
                                    whiteSpace: "pre-wrap",
                                  },
                                }
                              );
                            }
                          );
                        }
                      });
                    }
                  })
                }
                className="px-4 py-2 bg-blueColor text-white rounded hover:bg-blueColor/80"
              >
                Next
              </button>
            )}
            {currentStep === steps.length - 1 && (
              <button
                type="submit"
                onClick={() => {
                  if (!isPending && !isSubmitting) {
                    setSubmitError(null);
                    submitForm();
                  }
                }}
                disabled={isPending || isSubmitting || !isTurnstileVerified}
                className="px-4 py-2 bg-blueColor text-white rounded hover:bg-blueColor/80 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isPending || isSubmitting ? (
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
                ) : !isTurnstileVerified ? (
                  "Complete Security Verification to Submit"
                ) : (
                  "Submit"
                )}
              </button>
            )}
          </div>
        </form>
      )}
    </Formik>
  );
}
