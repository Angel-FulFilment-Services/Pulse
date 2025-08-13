import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

/**
 * Sends an SMS message.
 * @param {string} from - The sender's name or number.
 * @param {string} to - The recipient's phone number.
 * @param {string} message - The message content.
 * @returns {Promise<void>} - Resolves if the SMS is sent successfully, rejects otherwise.
 */
export async function sendSMS(from, to, message) {
  return toast.promise(
    axios.post('/api/t2/send_sms', {
      from,
      to,
      message,
    }, 
    {
      headers: {
        'X-API-Key': import.meta.env.VITE_T2_API_KEY,
        'Content-Type': 'application/json',
      }
    }),
    {
      pending: 'Sending SMS...',
      success: 'SMS Sent Successfully!',
      error: 'Failed to send SMS.',
    },
    {
      position: 'top-center',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: 'light',
    }
  );
}
