

export interface Workflow {
  name: string;
  processors?: Array<Processor>;
}

export interface Processor {
  name: string;
  description: string;
  properties?: Array<Property>;
}

export interface Property {
  name: string;
  description: string;
  value: string;
}


