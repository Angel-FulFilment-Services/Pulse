import React from 'react';

export default function SimpleList({ headers, data }) {
  return (
    <div className="isolate">
      <div className="flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full w-4/5 py-2 align-middle sm:px-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      scope="col"
                      className="py-3.5 px-3 text-left text-sm font-medium text-gray-500"
                    >
                      {header.visible !== false ? header.label : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="even:bg-gray-50">
                    {headers.map((header, colIndex) => (
                      <td
                        key={colIndex}
                        className="whitespace-nowrap px-3 py-2 text-sm text-gray-900"
                      >
                        {row[header.label.toLowerCase()] || row[header.label]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}