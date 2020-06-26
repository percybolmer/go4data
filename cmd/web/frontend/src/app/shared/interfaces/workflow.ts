
export interface Application{
  name: string;
  children?: Array<Workflow>;
  icon: string;
}
export interface Workflow{
    name: string;
    children?: Array<Processor>;
    icon: string;
}

  export interface Processor{
    name: string;
    Properties?: Map<string, Property>;
    available?: Array<Property>;
    icon: string;
  }

  export interface Property{
    name: string;
    description: string;
    value: string;
  }


