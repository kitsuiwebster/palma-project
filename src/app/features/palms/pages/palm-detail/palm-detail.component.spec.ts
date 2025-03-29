import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalmDetailComponent } from './palm-detail.component';

describe('PalmDetailComponent', () => {
  let component: PalmDetailComponent;
  let fixture: ComponentFixture<PalmDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PalmDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PalmDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
