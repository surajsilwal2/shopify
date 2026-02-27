import fs from "fs";
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi"; // this translate the zod schema to openapi schema, it takes the zod schema and generates the openapi document from it, we will use this to generate the openapi document from our api contracts
import { registerContract } from "./auth/register.js";
import { verifyContract } from "./auth/verify.js";
import { loginContract } from "./auth/login.js";
import { forgetPasswordContract } from "./auth/forgetPassword.js";
import { verifyForgetPasswordOtpContract } from "./auth/verifyForgetPasswordOtp.js";
import { resetPasswordContract } from "./auth/resetPassword.js";

// create registry
const registry = new OpenAPIRegistry(); //registry contain all apis, it's like a container for all the api contracts, we will register all the api contracts in this registry and then generate the openapi document from this registry

function register(contract: any) {
  registry.registerPath({
    method: contract.method,
    path: contract.path,
    request: {
      body: {
        content: {
          "application/json": {
            schema: contract.body
          }
        }
      }
    },
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: contract.response
          }
        }
      },
      400: {
        description: 'Bad request',
        content: {
          "application/json": {
            schema: contract.response
          }
        }
      }
    }
  })
}

function verify(contract: any) {
  registry.registerPath({
    method: contract.method,
    path: contract.path,
    request: {
      body: {
        content: {
          "application/json": {
            schema: contract.body
          }
        }
      }
    },
    responses: {
      200: {
        description: "Successful verify response",
        content: {
          "application/json": {
            schema: contract.response
          }
        }
      },
      201: {
        description: 'Sucessfully user registered',
        content: {
          "application/json": {
            schema: contract.response
          }
        }
      }, 
      400: {
        description: 'Bad request',
        content: {
          "application/json": {
            schema: contract.response
          }
        }
      }
    }
  })
}

function login(contract: any) {
  registry.registerPath({
    method: contract.method,
    path: contract.path,
    request: {
      body: {
        content: {
          "application/json": {
            schema: contract.body
          }
        }
      }
    },
    responses: {
      200: {
        description: "Successful login response",
        content: {
          "application/json": {
            schema: contract.response
          }
        }
      },
      400: {
        description: 'Bad request',
        content: {
          "application/json": {
            schema: contract.response
          }
        }
      }
    }
  })
}

function forgetPassword(contract: any) {
  registry.registerPath({
    method: contract.method,
    path: contract.path,
    request: {
      body: {
       content: {
        "application/json": {
          schema: contract.body
        }
       }
      }
    },
    responses: {
      200: {
        description: "Successful forget password response",
        content: {
          "application/json": {
            schema: contract.response
          }
        }
      },
      400: {
        description: 'Bad request',
        content: {
          "application/json": {
            schema: contract.response
          }
        }
      }
    }
  })
}

function verifyForgetPasswordOtp(contract: any) { 
  registry.registerPath({
    method: contract.method,
    path: contract.path,
    request: {
      body: {
        content: {
          "application/json": {
            schema: contract.body
          }
        }
      }
    },
    responses: {
      200: {
        description: "Successful verify forget password OTP response",
        content: {
          "application/json": {
            schema: contract.response
          }
        }
      },
      400: {
        description: 'Bad request',
        content: {
          "application/json": {
            schema: contract.response
          }
        }
      }
    }
  })
}

function resetPassword(contract: any) {
  registry.registerPath({
    method: contract.method,
    path: contract.path,
    request: {
      body: {
        content: {
          "application/json": {
            schema: contract.body
          }
        }
      }
    },
    responses: {
      200: {
        description: "Successful reset password response",
        content: {
          "application/json": {
            schema: contract.response
          }
        }
      },
      400: {
        description: 'Bad request',
        content: {
          "application/json": {
            schema: contract.response
          }
        }
      }
    }
  })
}

register(registerContract)
verify(verifyContract)
login(loginContract)
forgetPassword(forgetPasswordContract)
verifyForgetPasswordOtp(verifyForgetPasswordOtpContract)
resetPassword(resetPasswordContract)


const generator = new OpenApiGeneratorV3(registry.definitions); // convert registry to openapi document, it takes the registry and generates the openapi document from it

const docs = generator.generateDocument({ // generateDocument generate the openapi document, it takes the openapi document as a parameter and returns the openapi document, we will use this document to write it to a file called openapi.json
  openapi: "3.0.0",
  info: {
    title: "API Documentation",
    version: "1.0.0",
    description: "This is the API documentation for our services.",
  },
  servers: [{ url: "http://localhost:6001/api" }],
});

fs.writeFileSync("openapi.json", JSON.stringify(docs, null, 2)); // json.stringify(docs, null, 2) is used to format the json document with indentation of 2 spaces and null handles circular references, we will write the openapi document to a file called openapi.json, this file will be used by the swagger ui to display the api documentation


