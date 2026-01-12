import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Proxy GET request to backend
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to backend',
      },
      { status: 500 }
    );
  }
}

// Proxy PUT request to backend
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const authHeader = request.headers.get('Authorization');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update job',
      },
      { status: 500 }
    );
  }
}

// Proxy DELETE request to backend
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const authHeader = request.headers.get('Authorization');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${id}`, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 204) {
      return NextResponse.json({
        success: true,
        message: 'Job deleted successfully',
      });
    }
    
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete job',
      },
      { status: 500 }
    );
  }
}
