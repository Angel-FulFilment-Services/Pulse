import React, { useState, useEffect } from 'react';
import useFetchEmployee from './useFetchEmployee';
import { format, startOfDay, endOfDay, subDays, differenceInMinutes } from 'date-fns';

export default function UserFlyoutContentEmployee({ hrId }) {
  const [isTransitioning, setIsTransitioning] = useState(true);

  const { employee, isLoading } = useFetchEmployee(hrId);

  useEffect(() => {
    if (employee) {
      setIsTransitioning(false);
    }
  },[employee]);

  return (
    <div className="px-4 py-3 h-full flex flex-col justify-start items-start divide-y divide-gray-200">
      <div className="flex flex-col gap-y-1 pb-2 justify-between w-full">
        <h3 className="text-base font-semibold text-gray-900">Employee Information</h3>
        <p className="max-w-2xl text-sm text-gray-500">Basic employee Information and contact details.</p>
      </div>
      <div className="w-full h-full pt-2 pb-2 flex flex-col gap-y-4 justify-between items-start">
          <div className="w-full h-full grid grid-cols-3 space-4 space-y-2 justify-between items-center">
            <div>
              <div className="text-sm text-gray-600 font-medium">Fullname</div>
              { isTransitioning ? <p class="w-32 h-4 mt-1 bg-gray-100 animate-pulse rounded-full"></p> : <p className="text-sm text-gray-500"> {employee.name ?? "-"} </p>}
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Job title</div>
              { isTransitioning ? <p class="w-32 h-4 mt-1 bg-gray-100 animate-pulse rounded-full"></p> : <p className="text-sm text-gray-500"> {employee.job_title ?? "-"} </p>}
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Started</div>
              { isTransitioning ? <p class="w-32 h-4 mt-1 bg-gray-100 animate-pulse rounded-full"></p> : <p className="text-sm text-gray-500"> {employee.start_date ? format(employee.start_date, "MMMM d, y" ) : "-"} </p>}
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Mobile Phone</div>
              { isTransitioning ? <p class="w-32 h-4 mt-1 bg-gray-100 animate-pulse rounded-full"></p> : <p className="text-sm text-gray-500"> {employee.contact_mobile_phone ?? "-"} </p>}
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Home Phone</div>
              { isTransitioning ? <p class="w-32 h-4 mt-1 bg-gray-100 animate-pulse rounded-full"></p> : <p className="text-sm text-gray-500"> {employee.contact_home_phone ?? "-"} </p>}
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Email</div>
              { isTransitioning ? <p class="w-32 h-4 mt-1 bg-gray-100 animate-pulse rounded-full"></p> : <p className="text-sm text-gray-500"> {employee.email ?? "-"} </p>}
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Address</div>
              { isTransitioning ? <p class="w-56 h-4 mt-1 bg-gray-100 animate-pulse rounded-full"></p> : <p className="text-sm text-gray-500"> 
                {employee.home_address1 ? employee.home_address1 : ""} 
                {employee.home_address2 ? `,  ${employee.home_address2}` : ""} 
                {employee.home_address3 ? `,  ${employee.home_address3}` : ""} 
                {employee.home_town ? `,  ${employee.home_town}` : ""} 
                {employee.home_county ? `,  ${employee.home_county}` : ""} 
                {employee.home_postcode ? `,  ${employee.home_postcode}` : ""}
              </p>}
            </div>
          </div>
      </div>
      <div className="flex flex-col gap-y-1 py-2 justify-between w-full">
        <h3 className="text-base font-semibold text-gray-900">Next of Kin</h3>
        <p className="max-w-2xl text-sm text-gray-500">Next of Kin Information and contact details.</p>
      </div>
      <div className="w-full h-full pt-2 pb-2 flex flex-col gap-y-4 justify-between items-start">
          <div className="w-full h-full grid grid-cols-3 space-4 space-y-3 justify-between items-center">
            <div>
              <div className="text-sm text-gray-600 font-medium">Fullname (Next of Kin 1)</div>
              { isTransitioning ? <p class="w-32 h-4 mt-1 bg-gray-100 animate-pulse rounded-full"></p> : <p className="text-sm text-gray-500"> {employee.kin1_fullname ?? "-"} </p>}
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Mobile Phone (Next of Kin 1)</div>
              { isTransitioning ? <p class="w-32 h-4 mt-1 bg-gray-100 animate-pulse rounded-full"></p> : <p className="text-sm text-gray-500"> {employee.kin1_home_phone ?? "-"} </p>}
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Home Phone (Next of Kin 1)</div>
              { isTransitioning ? <p class="w-32 h-4 mt-1 bg-gray-100 animate-pulse rounded-full"></p> : <p className="text-sm text-gray-500"> {employee.kin1_mobile_phone ?? "-"} </p>}
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Fullname (Next of Kin 2)</div>
              { isTransitioning ? <p class="w-32 h-4 mt-1 bg-gray-100 animate-pulse rounded-full"></p> : <p className="text-sm text-gray-500"> {employee.kin2_fullname ?? "-"} </p>}
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Mobile Phone (Next of Kin 2)</div>
              { isTransitioning ? <p class="w-32 h-4 mt-1 bg-gray-100 animate-pulse rounded-full"></p> : <p className="text-sm text-gray-500"> {employee.kin2_home_phone ?? "-"} </p>}
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Home Phone (Next of Kin 2)</div>
              { isTransitioning ? <p class="w-32 h-4 mt-1 bg-gray-100 animate-pulse rounded-full"></p> : <p className="text-sm text-gray-500"> {employee.kin2_mobile_phone ?? "-"} </p>}
            </div>
          </div>
      </div>
    </div>
  );
}