import { useState, useCallback } from 'react';
import { validateField, ValidationError } from '@/utils/validation';

interface UseFormValidationOptions {
  initialValues: Record<string, any>;
  validationRules: Record<string, any>;
  onSubmit: (formData: Record<string, any>) => Promise<void>;
}

export const useFormValidation = ({
  initialValues,
  validationRules,
  onSubmit,
}: UseFormValidationOptions) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate single field
   */
  const validateSingleField = useCallback(
    (fieldName: string, value: any) => {
      const rules = validationRules[fieldName];
      if (!rules) return null;

      const error = validateField(fieldName, value, rules);
      
      // Update errors
      setErrors((prevErrors) => {
        const filtered = prevErrors.filter((e) => e.field !== fieldName);
        if (error) {
          return [...filtered, { field: fieldName, message: error }];
        }
        return filtered;
      });

      return error;
    },
    [validationRules]
  );

  /**
   * Handle field change
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      
      let finalValue = value;
      if (type === 'number') {
        finalValue = value === '' ? '' : Number(value);
      }

      setFormData((prev) => ({
        ...prev,
        [name]: finalValue,
      }));

      // Validate on change if field has been touched
      if (touched.has(name)) {
        validateSingleField(name, finalValue);
      }
    },
    [touched, validateSingleField]
  );

  /**
   * Handle file input change
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
      const file = e.target.files?.[0];
      
      setFormData((prev) => ({
        ...prev,
        [fieldName]: file || null,
      }));

      if (touched.has(fieldName)) {
        validateSingleField(fieldName, file);
      }
    },
    [touched, validateSingleField]
  );

  /**
   * Handle field blur
   */
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      
      // Mark field as touched
      setTouched((prev) => new Set(prev).add(name));
      
      // Validate on blur
      validateSingleField(name, formData[name]);
    },
    [formData, validateSingleField]
  );

  /**
   * Check if form is valid
   */
  const isFormValid = useCallback(() => {
    return errors.length === 0 && Object.keys(touched).length > 0;
  }, [errors, touched]);

  /**
   * Check if field has error
   */
  const getFieldError = useCallback(
    (fieldName: string): string | null => {
      const error = errors.find((e) => e.field === fieldName);
      return error ? error.message : null;
    },
    [errors]
  );

  /**
   * Check if field should show error
   */
  const shouldShowError = useCallback(
    (fieldName: string): boolean => {
      return touched.has(fieldName) && errors.some((e) => e.field === fieldName);
    },
    [errors, touched]
  );

  /**
   * Handle form submit
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Mark all fields as touched
      setTouched(new Set(Object.keys(formData)));
      
      // Validate all fields
      const newErrors: ValidationError[] = [];
      Object.keys(validationRules).forEach((fieldName) => {
        const error = validateField(fieldName, formData[fieldName], validationRules[fieldName]);
        if (error) {
          newErrors.push({ field: fieldName, message: error });
        }
      });
      
      setErrors(newErrors);
      
      // If valid, submit
      if (newErrors.length === 0) {
        setIsSubmitting(true);
        try {
          await onSubmit(formData);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [formData, validationRules, onSubmit]
  );

  /**
   * Reset form
   */
  const resetForm = useCallback(() => {
    setFormData(initialValues);
    setErrors([]);
    setTouched(new Set());
  }, [initialValues]);

  /**
   * Set field value programmatically
   */
  const setFieldValue = useCallback((fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  }, []);

  /**
   * Set field error programmatically
   */
  const setFieldError = useCallback((fieldName: string, message: string | null) => {
    setErrors((prev) => {
      const filtered = prev.filter((e) => e.field !== fieldName);
      if (message) {
        return [...filtered, { field: fieldName, message }];
      }
      return filtered;
    });
  }, []);

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleFileChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    getFieldError,
    shouldShowError,
    isFormValid: isFormValid(),
    validateSingleField,
  };
};
