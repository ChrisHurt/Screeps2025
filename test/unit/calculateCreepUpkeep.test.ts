import { expect } from "chai";
import * as  sinon from "sinon"
import { calculateCreepUpkeep } from "../../src/helpers/calculateCreepUpkeep";
import * as calculateLifetimeUpkeepModule from "../../src/helpers/calculateLifetimeUpkeep";
import * as calculateRenewalEfficiencyModule from "../../src/helpers/calculateRenewalEfficiency";

describe("calculateCreepUpkeep", () => {
    const body: BodyPartConstant[] = ["move", "work", "carry"];

    it("should call calculateLifetimeUpkeep when isRenewed is false", () => {
        const stub = sinon.stub(calculateLifetimeUpkeepModule, "calculateLifetimeUpkeep").returns(123);
        const result = calculateCreepUpkeep({ body });
        expect(stub.calledOnceWithExactly({ body })).to.be.true;
        expect(result).to.equal(123);
        stub.restore();
    });

    it("should call calculateRenewalEfficiency when isRenewed is true", () => {
        const stub = sinon.stub(calculateRenewalEfficiencyModule, "calculateRenewalEfficiency").returns(456);
        const result = calculateCreepUpkeep({ body, isRenewed: true });
        expect(stub.calledOnceWithExactly({ body })).to.be.true;
        expect(result).to.equal(456);
        stub.restore();
    });

    it("should default isRenewed to false", () => {
        const stub = sinon.stub(calculateLifetimeUpkeepModule, "calculateLifetimeUpkeep").returns(789);
        const result = calculateCreepUpkeep({ body });
        expect(result).to.equal(789);
        stub.restore();
    });
});
