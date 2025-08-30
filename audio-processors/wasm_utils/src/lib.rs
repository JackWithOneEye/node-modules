extern crate proc_macro;
use proc_macro::TokenStream;
use quote::{format_ident, quote};
use syn::{Data, DeriveInput, Fields, Type, parse_macro_input};

#[proc_macro_derive(IOBufferPtrs, attributes(io_buffer))]
pub fn derive_io_buffer_ptrs(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let struct_name = input.ident;

    let mut ptr_methods = Vec::new();
    let mut errors = Vec::new();

    if let Data::Struct(data_struct) = input.data {
        if let Fields::Named(fields_named) = data_struct.fields {
            for field in fields_named.named.iter() {
                let attrs = &field.attrs;
                let is_io_buffer = attrs.iter().any(|a| a.path().is_ident("io_buffer"));
                if is_io_buffer {
                    let field_name = field.ident.as_ref().unwrap();
                    let method_name = format_ident!("{}_ptr", field_name);
                    
                    // Check if the field is Vec<f32> and generate error if not
                    if let Type::Path(type_path) = &field.ty {
                        if type_path.path.segments.last().unwrap().ident == "Vec" {
                            // Check if it's Vec<f32> specifically
                            if let syn::PathArguments::AngleBracketed(args) = &type_path.path.segments.last().unwrap().arguments {
                                if let syn::GenericArgument::Type(Type::Path(inner_type)) = &args.args[0] {
                                    if inner_type.path.segments.last().unwrap().ident == "f32" {
                                        ptr_methods.push(quote! {
                                            pub fn #method_name(&mut self) -> *mut f32 {
                                                self.#field_name.as_mut_ptr()
                                            }
                                        });
                                        continue;
                                    }
                                }
                            }
                        }
                    }
                    
                    // If we reach here, the field has io_buffer attribute but is not Vec<f32>
                    let field_type = quote! { #field.ty };
                    errors.push(quote! {
                        compile_error!(concat!(
                            "Field '", stringify!(#field_name), "' has io_buffer attribute but is not of type Vec<f32>. ",
                            "Found type: ", stringify!(#field_type)
                        ));
                    });
                }
            }
        }
    }

    let expanded = quote! {
        #[wasm_bindgen]
        impl #struct_name {
            #(#ptr_methods)*
        }
        
        // Generate compilation errors for invalid io_buffer attributes
        #(#errors)*
    };

    TokenStream::from(expanded)
}
