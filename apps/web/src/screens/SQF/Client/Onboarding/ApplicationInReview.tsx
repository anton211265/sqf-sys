import React from 'react';

const ApplicationInReview = () => {
  return (
    <div className="flex flex-col">
      <h1 className="mt-2 font-extrabold text-4xl text-center sm:text-left">
        Your application is under review.
      </h1>
      <p className="mt-2 text-center sm:text-left">
        We’re currently reviewing it to ensure everything is in order. Please
        allow us some time to complete this process. We’ll update you as soon as
        possible.
      </p>
      <p className="mt-7 text-center sm:text-left">
        Thank you for your patience!
      </p>
    </div>
  );
};

export default ApplicationInReview;
