import React from 'react';

export default function SimpleList({ headers, data }) {
  return (
    <div className="isolate">
      <div className="flow-root">
        <div className="overflow-x-hidden">
          <div className="inline-block min-w-full w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead>
                <tr clasName="justify-center items-center">
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      scope="col"
                      className="py-3.5 px-3 text-left text-sm font-medium text-gray-500 w-auto"
                    >
                      {header.visible !== false ? header.label : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="even:bg-gray-50 dark:bg-dark-900">
                    {headers.map((header, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-3 py-2 text-sm text-gray-900 max-w-96"
                      >
                        <div className={`${header.className || ''}`}>
                          {row[header.label.toLowerCase().replace( /\s/g, '')] || row[header.label]}
                        </div>
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