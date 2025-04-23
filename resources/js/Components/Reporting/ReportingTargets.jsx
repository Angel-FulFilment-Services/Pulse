import React, { useState, useMemo } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import SelectControl from '../../Components/Controls/SelectControl';
import NumberInput from '../../Components/Forms/NumberInput';

export default function ReportingTargets({ column, targets, handleTargetChange }) {

  const target = useMemo(() => {
    return targets.find((t) => t.id === column.id);
  }
  , [targets, column.id]);

  return (
    <div className="w-full mx-auto flex flex-col space-y-2 divide-y divide-gray-300 cursor-auto">
      <div className="w-full flex justify-between items-center gap-x-6">
        <div className="w-full flex items-center justify-start">
          <h1 className="text-sm text-gray-600"> Target Direction </h1>
        </div>
        <div className="w-1 h-1 flex-shrink-0 rounded-full bg-gray-300"></div>
        <div className="w-full flex items-center justify-end gap-x-1 pr-6">
            <SelectControl width={"w-36"} items={[
                {id: "asc", value: "asc", displayValue: "Ascending"},
                {id: "desc", value: "desc", displayValue: "Descending"},
              ]} 
              id={"direction"}
              defaultSelected={{id: target?.targetDirection, value: target?.targetDirection, displayValue: target?.targetDirection == 'asc' ? 'Ascending' : 'Descending'}}
              onSelectChange ={(value) => handleTargetChange({id: column.id, key: "targetDirection", target: value.value})}
              placeHolder={"Direction"} />
        </div>
      </div>
      <div className="w-full flex justify-between items-center gap-x-6 pt-2">
        <div className="w-full flex items-center justify-start">
          <h1 className="text-sm text-gray-600"> Target <span className="text-gray-400">(High)</span> </h1>
        </div>
        <div className="w-1 h-1 flex-shrink-0 rounded-full bg-gray-300"></div>
        <div className="w-full flex items-center justify-end gap-x-1">
          {column.dataType == 'Currency' ? 
            <NumberInput id={null} prefix={"£"} placeholder={"0"} currentState={target?.target?.high} onTextChange={(value) => handleTargetChange({id: column.id, key: "high", target: value[0].value})} width="w-36" autoComplete={"false"}/>
            :
            column.suffix == '%' ?
              <NumberInput id={null} suffix={"%"} placeholder={"0"} currentState={target?.target?.high} onTextChange={(value) => handleTargetChange({id: column.id, key: "high", target: value[0].value})} width="w-36" autoComplete={"false"}/>
            :
              <NumberInput id={null} placeholder={"0"} currentState={target?.target?.high} onTextChange={(value) => handleTargetChange({id: column.id, key: "high", target: value[0].value})} width="w-36" autoComplete={"false"}/>
          }
          <XMarkIcon className="w-5 h-5 text-gray-400 cursor-pointer" onClick={(value) => handleTargetChange({id: column.id, key: "high", target: null})}/>
        </div>
      </div>
      <div className="w-full flex justify-between items-center gap-x-6 pt-2">
        <div className="w-full flex items-center justify-start">
          <h1 className="text-sm text-gray-600"> Target <span className="text-gray-400">(Low)</span> </h1>
        </div>
        <div className="w-1 h-1 flex-shrink-0 rounded-full bg-gray-300"></div>
        <div className="w-full flex items-center justify-end gap-x-1">
          {column.dataType == 'Currency' ? 
            <NumberInput id={null} prefix={"£"} placeholder={"0"} currentState={target?.target?.low} onTextChange={(value) => handleTargetChange({id: column.id, key: "low", target: value[0].value})} width="w-36" autoComplete={"false"}/>
            :
            column.suffix == '%' ?
              <NumberInput id={null} suffix={"%"} placeholder={"0"} currentState={target?.target?.low} onTextChange={(value) => handleTargetChange({id: column.id, key: "low", target: value[0].value})} width="w-36" autoComplete={"false"}/>
            :
              <NumberInput id={null} placeholder={"0"} currentState={target?.target?.low} onTextChange={(value) => handleTargetChange({id: column.id, key: "low", target: value[0].value})} width="w-36" autoComplete={"false"}/>
          }
          <XMarkIcon className="w-5 h-5 text-gray-400 cursor-pointer" onClick={(value) => handleTargetChange({id: column.id, key: "low", target: null})}/>
        </div>
      </div>
    </div>
  );
}
