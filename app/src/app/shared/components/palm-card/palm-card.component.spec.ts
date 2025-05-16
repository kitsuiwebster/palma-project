import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalmCardComponent } from './palm-card.component';

describe('PalmCardComponent', () => {
  let component: PalmCardComponent;
  let fixture: ComponentFixture<PalmCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PalmCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PalmCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
