import { NextResponse } from 'next/server';
import { mockCV } from '@/lib/mock-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: 'User ID is required',
      },
      { status: 400 }
    );
  }
  
  // In a real app, fetch from database
  return NextResponse.json({
    success: true,
    data: mockCV,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.personalInfo || !body.personalInfo.fullName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Personal information is required',
        },
        { status: 400 }
      );
    }
    
    // In a real app, save to database
    const newCV = {
      id: 'cv-' + Date.now(),
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return NextResponse.json({
      success: true,
      message: 'CV created successfully',
      data: newCV,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create CV',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'CV ID is required',
        },
        { status: 400 }
      );
    }
    
    // In a real app, update in database
    const updatedCV = {
      ...body,
      updatedAt: new Date(),
    };
    
    return NextResponse.json({
      success: true,
      message: 'CV updated successfully',
      data: updatedCV,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update CV',
      },
      { status: 500 }
    );
  }
}





