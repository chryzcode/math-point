"use client";

import BookingForm from '../components/BookingForm';
import withAuth from '../context/withAuth';

const DemoBookingForm = () =>{
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <BookingForm />
        </div>
    );
}

export default withAuth(DemoBookingForm);
