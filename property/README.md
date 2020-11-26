# Property
Property is a package that allows users to store either configurations for handlers or metadata for Payloads in a generic way.
## Property
A property is a simple struct that contains a Name for the property, a Value (interface{}) and a Description.  
There is also a required boolean which is used to make sure that the property is filled with correct information before running a handler.  

Since the value field is a interface we can assign any value here.
Note that when using the property you have to type asset or use the built in type asserts in the property. 
## Configuration
Instead of having many Propertys in a handler its easier to stack them together in a sort of manager. The configuration struct is used to properly manage properties. 

It allows you to add, set values, remove and validate properties in bulk instead of one by one.  
It also avoids running duplicate properties. 
## Usage

```golang
    // First you need to create a Configuration
    p := property.NewConfiguration()
    // Then you need to Add Properties along with a description and requirement
    // this is usually done by the Handler itself
    p.AddProperty("someConfig", "description", false)
    // You can then set the value of the property
    mywantedPropert := []string{"this", "is", "my", "splice"}
    p.SetProperty("someConfig", mywantedPropert)

    p.GetProperty("someConfig").StringSplice()

```
