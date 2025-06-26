import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        res.status(409).json({
          success: false,
          message: 'A record with this information already exists',
          error: 'Duplicate entry',
        });
        return;
      
      case 'P2025':
        res.status(404).json({
          success: false,
          message: 'Record not found',
          error: 'Not found',
        });
        return;
      
      case 'P2003':
        res.status(400).json({
          success: false,
          message: 'Invalid reference to related record',
          error: 'Foreign key constraint',
        });
        return;
      
      case 'P2014':
        res.status(400).json({
          success: false,
          message: 'Invalid ID provided',
          error: 'Invalid ID',
        });
        return;
      
      default:
        res.status(500).json({
          success: false,
          message: 'Database error occurred',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
        return;
    }
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: error.message,
    });
    return;
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'Authentication failed',
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
      error: 'Authentication failed',
    });
    return;
  }

  // Multer errors (file upload)
  if (error.name === 'MulterError') {
    res.status(400).json({
      success: false,
      message: 'File upload error',
      error: error.message,
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
};