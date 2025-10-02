import { env } from '@/env'
import { fastifyCors } from '@fastify/cors'
import { fastify } from 'fastify'
import { serializerCompiler, validatorCompiler, hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'

const server = fastify()

server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

server.setErrorHandler(( error, request, reply ) => {
  if(hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      message: 'Validation error',
      issues: error.validation,
    })
  }

  // Enviar erro para alguma ferramenta de observabilidade (Sentry / Datadog / Grafana / OTel)

  console.error(error)

  return reply.status(500).send({ message: 'Internal server error.' })
})

server.register(fastifyCors, { origin: '* ' })

console.log(env.DATABASE_URL)

server.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log('HTTP server running!')
})
