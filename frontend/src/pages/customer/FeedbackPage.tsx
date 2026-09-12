import { useState, FormEvent } from 'react';
import axiosInstance from '@/api/axiosInstance';

interface FieldErrors {
  rating?: string;
  title?: string;
  comment?: string;
  productId?: string;
  general?: string;
}

export default function FeedbackPage() {
  const [rating, setRating] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [productId, setProductId] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (rating < 1 || rating > 5) {
      errs.rating = 'Please select a rating between 1 and 5 stars.';
    }
    if (title.length < 3 || title.length > 100) {
      errs.title = 'Title must be between 3 and 100 characters.';
    }
    if (comment.length < 10 || comment.length > 2000) {
      errs.comment = 'Comment must be between 10 and 2000 characters.';
    }
    if (productId && isNaN(Number(productId))) {
      errs.productId = 'Product ID must be a valid number.';
    }
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      await axiosInstance.post('/feedback', {
        rating,
        title: title.trim(),
        comment: comment.trim(),
        ...(productId ? { productId: Number(productId) } : {}),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { fieldErrors?: Record<string, string>; message?: string } } };
      if (axiosErr.response?.data?.fieldErrors) {
        setErrors(axiosErr.response.data.fieldErrors as FieldErrors);
      } else if (axiosErr.response?.data?.message) {
        setErrors({ general: axiosErr.response.data.message });
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h2 className="text-xl font-semibold text-green-800 mb-2">Thank you for your feedback!</h2>
          <p className="text-green-700 mb-4">Your feedback has been submitted successfully and will be reviewed shortly.</p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setRating(0);
              setTitle('');
              setComment('');
              setProductId('');
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="font-display text-2xl text-[#2c2c2c] mb-6">Submit Feedback</h1>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-red-700 text-sm">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-[#2c2c2c] mb-1">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                aria-pressed={rating === star}
                className="p-1 focus:outline-none focus:ring-2 focus:ring-[#a06b3a] rounded"
              >
                <svg
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoveredStar || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-[#e8dfcd] fill-[#e8dfcd]'
                  }`}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>
          {errors.rating && <p className="text-red-600 text-sm mt-1">{errors.rating}</p>}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="feedback-title" className="block text-sm font-medium text-[#2c2c2c] mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="feedback-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="Brief summary of your feedback"
            className="w-full border border-[#2c2c2c]/15 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#a06b3a] focus:border-[#a06b3a]"
          />
          <div className="flex justify-between mt-1">
            {errors.title ? (
              <p className="text-red-600 text-sm">{errors.title}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-[#8a7a6b]">{title.length}/100</span>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="feedback-comment" className="block text-sm font-medium text-[#2c2c2c] mb-1">
            Comment <span className="text-red-500">*</span>
          </label>
          <textarea
            id="feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="Tell us more about your experience (min 10 characters)"
            className="w-full border border-[#2c2c2c]/15 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#a06b3a] focus:border-[#a06b3a] resize-y"
          />
          <div className="flex justify-between mt-1">
            {errors.comment ? (
              <p className="text-red-600 text-sm">{errors.comment}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-[#8a7a6b]">{comment.length}/2000</span>
          </div>
        </div>

        {/* Optional Product Reference */}
        <div>
          <label htmlFor="feedback-product" className="block text-sm font-medium text-[#2c2c2c] mb-1">
            Product ID <span className="text-[#8a7a6b] text-xs">(optional)</span>
          </label>
          <input
            id="feedback-product"
            type="text"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="Enter product ID if related to a specific product"
            className="w-full border border-[#2c2c2c]/15 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#a06b3a] focus:border-[#a06b3a]"
          />
          {errors.productId && <p className="text-red-600 text-sm mt-1">{errors.productId}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#a06b3a] text-white py-2.5 px-4 rounded font-medium hover:bg-[#7a4f28] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}
