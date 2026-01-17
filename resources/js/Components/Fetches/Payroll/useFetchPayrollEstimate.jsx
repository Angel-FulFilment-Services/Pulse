import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { differenceInYears, parseISO } from 'date-fns';
import { getRateForDate } from '../../../Utils/minimumWage.jsx';

const useFetchPayrollEstimate = () => {
  const [payrollData, setPayrollData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Only fetch once
    if (hasFetched.current) return;
    hasFetched.current = true;

    const controller = new AbortController();

    const fetchPayrollEstimate = async () => {
      try {
        setIsLoading(true);

        const response = await axios.get('/user/payroll/estimate', {
          signal: controller.signal,
        });

        let data = response.data;

        // If using minimum wage, calculate pay on frontend based on DOB and daily hours
        if (data.use_minimum_wage && data.date_of_birth && data.daily_hours) {
          const dob = parseISO(data.date_of_birth);
          const dailyHours = data.daily_hours;
          
          let basePay = 0;
          const ratesUsed = new Set();
          
          // Calculate pay for each day using the correct rate based on age on that day
          for (const [dateStr, hours] of Object.entries(dailyHours)) {
            const date = parseISO(dateStr);
            const age = differenceInYears(date, dob);
            const rate = getRateForDate(age, date);
            
            if (rate !== null) {
              basePay += hours * rate;
              ratesUsed.add(rate);
            }
          }
          
          basePay = Math.round(basePay * 100) / 100;
          const uniqueRates = [...ratesUsed].sort((a, b) => a - b);
          const isVariableRate = uniqueRates.length > 1;
          
          // Calculate average rate for display purposes
          const avgRate = uniqueRates.length > 0
            ? Math.round((uniqueRates.reduce((a, b) => a + b, 0) / uniqueRates.length) * 100) / 100
            : 0;
          
          data = {
            ...data,
            hourly_rate: isVariableRate ? avgRate : (uniqueRates[0] || 0),
            hourly_rates: isVariableRate ? uniqueRates : undefined,
            base_pay: basePay,
            estimated_pay: Math.round((basePay + data.bonus) * 100) / 100,
            variable_rate: isVariableRate,
          };
        }

        setPayrollData(data);
        setIsLoading(false);
        setIsLoaded(true);
      } catch (error) {
        setIsLoading(false);
        setIsLoaded(false);

        if (axios.isCancel(error)) {
          console.log('Fetch aborted');
        } else {
          console.error('Error fetching payroll estimate:', error);
        }
      }
    };

    fetchPayrollEstimate();

    return () => {
      controller.abort();
    };
  }, []);

  return { payrollData, isLoading, isLoaded };
};

export default useFetchPayrollEstimate;
